// Records docs/demo.gif: drives a private headless Chrome over the DevTools
// protocol against the local dev server, captures a frame per step, then
// encodes the frames with ffmpeg. Needs Google Chrome and ffmpeg (macOS paths).
//
//   npm run dev                                   # in another terminal
//   node scripts/record-demo.mjs                  # the built-in demo apartment
//   node scripts/record-demo.mjs '<share link>'   # a layout from the Share button
//
// Frames and the Chrome profile go to .demo/ (git-ignored); the GIF to docs/.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('.demo');
const SHARE = process.argv[2];
const URL_ = 'http://localhost:5180/';
const PORT = 9333;
const W = 1280, H = 720;
const FRAMES = path.join(OUT, 'frames');
fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });
const profile = path.join(OUT, 'chrome-profile');
fs.rmSync(profile, { recursive: true, force: true });

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, nextId = 1;
const pending = new Map();
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        ws.onmessage = (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
          }
        };
        return;
      }
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
async function js(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('page error: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result.value;
}
// Let the editor render the current state (two animation frames).
const settle = () => js('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');

let frame = 0;
async function shot(hold = 1) {
  await settle();
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(data, 'base64');
  for (let i = 0; i < hold; i++) fs.writeFileSync(path.join(FRAMES, `f${String(frame++).padStart(4, '0')}.png`), buf);
}
async function mouse(type, x, y, buttons = 0) {
  await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1 });
}
async function click(x, y) { await mouse('mouseMoved', x, y); await mouse('mousePressed', x, y, 1); await mouse('mouseReleased', x, y); }
async function center(selectorJs) {
  return js(`(() => { const e = ${selectorJs}; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
}
// World point → viewport pixel, via the editor's camera.
const toScreen = (x, y, z) => js(`(() => { const ed = window.roomplan; const v = ed.camera.position.clone().set(${x}, ${y}, ${z}).project(ed.camera); const r = ed.canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; })()`);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// The demo apartment: living room, kitchen run, dining table, a bedroom corner
// and a bathroom closed off by interior walls with a door.
const BUILD_DEMO = `(() => {
  const ed = window.roomplan; const P = Math.PI; const bad = [];
  ed.clearAll(true);
  ed.setRoomShape('rectangle'); ed.setRoomWidth(6.4); ed.setRoomLength(4.6); ed.setRoomHeight(2.6);
  ed.setFloorFinish('wood'); ed.setWallColor(0xf3eee6);
  const put = (type, x, z, rot = 0, color) => {
    const g = ed.addFurniture(type, { x, z });
    g.rotation.y = rot; g.position.set(x, 0, z);
    if (color != null) ed.recolor(g, color);
    if (!ed.placementOk(x, z, rot, g.userData.w, g.userData.d)) bad.push(type + '@' + x + ',' + z);
    return g;
  };
  // bathroom in the back-left corner
  ed.addWall([-1.4, -2.25], [-1.4, -0.6], 0.1);
  ed.addWall([-3.15, -0.6], [-1.4, -0.6], 0.1);
  const bathDoor = ed.addOpening('door-std'); bathDoor.userData.wallIndex = 1; bathDoor.userData.t = 0.62; ed.positionOpening(bathDoor);
  put('toilet', -2.8, -1.3, P / 2);
  put('shower', -2.7, -1.8);
  put('bathroom-sink', -1.85, -2.05);
  // kitchen run along the back wall, wall cabinets above it
  put('fridge', -0.97, -1.95);
  put('counter', 0.0, -2.0);
  put('sink', 0.9, -2.0);
  put('stove', 1.5, -2.0);
  for (const t of [0.5, 0.6875]) { const c = ed.addOpening('cabinet', 0); c.userData.t = t; ed.positionOpening(c); }
  const win = ed.addOpening('win-std', 0); win.userData.t = 0.9; ed.positionOpening(win);
  // living area against the left wall
  put('tv', -3.0, 1.25, P / 2, 0x3a3f48);
  put('rug', -1.95, 1.25, P / 2, 0xc06a4a);
  put('sofa', -0.85, 1.25, -P / 2, 0x4f7f9a);
  put('plant', -2.95, 2.05, 0);
  const win2 = ed.addOpening('win-std', 3); win2.userData.t = 0.43; ed.positionOpening(win2);
  // dining
  put('table', 0.75, 0.15, 0, 0xb98a55);
  for (const [x, z, r] of [[0.45, -0.45, 0], [1.05, -0.45, 0], [0.45, 0.75, P], [1.05, 0.75, P]]) put('chair', x, z, r, 0x7a5a3c);
  // bedroom corner
  put('bed', 2.17, 1.25, -P / 2, 0x8aa6c8);
  put('wardrobe', 2.9, -0.75, -P / 2, 0xd9d2c4);
  put('shelf', 2.2, -1.35, 0, 0x9a8466);
  // lights
  for (const [x, z] of [[0.75, 0.15], [2.2, 1.0], [-1.9, 1.25]]) ed.addCeilingLight({ x, z });
  ed.lights.forEach((l) => { ed.selected = l; ed.setLightIntensity(8); });
  ed.select(null);
  ed.initFloors();
  return bad;
})()`;

// The opening camera: steeper than the default so the interior walls hide less.
const TARGET = { x: 0, y: 0.3, z: 0.1 };
const orbit = (angleDeg, radius = 8.6, height = 7.4) => js(`(() => { const ed = window.roomplan; const a = ${angleDeg} * Math.PI / 180;
  ed.camera.position.set(${TARGET.x} + Math.sin(a) * ${radius}, ${height}, ${TARGET.z} + Math.cos(a) * ${radius});
  ed.controls.target.set(${TARGET.x}, ${TARGET.y}, ${TARGET.z}); ed.controls.update(); })()`);

try {
  await connect();
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 60 && !(await js('!!(window.roomplan && window.roomplan.renderer)').catch(() => false)); i++) await sleep(250);
  await sleep(500);

  if (SHARE) {
    // The part after #share= is the layout, base64url-encoded by the app.
    const encoded = SHARE.split('#share=')[1];
    if (!encoded) throw new Error('Pass a link copied with the Share button (it contains #share=)');
    await js(`(() => { const ed = window.roomplan; ed.applyState(ed.decodeSharedLayout(${JSON.stringify(encoded)})); ed.select(null); })()`);
  } else {
    const bad = await js(BUILD_DEMO);
    if (bad.length) console.warn('placements outside the room or into a wall:', bad);
  }
  await js('window.roomplan.setView("perspective")');

  // 1) Opening shot: a slow orbit round the furnished room.
  for (let i = 0; i < 26; i++) { await orbit(28 + 22 * ease(i / 25)); await shot(); }
  await shot(4);

  // 2) Search the catalog: type "plant", then drop one in.
  const search = await center(`document.querySelector('.search-input')`);
  await click(search.x, search.y);
  for (const ch of 'plant') { await send('Input.insertText', { text: ch }); await shot(2); }
  await shot(5);
  const plantBtn = await center(`[...document.querySelectorAll('.cat-item')].find(b => b.textContent.includes('Plant'))`);
  await click(plantBtn.x, plantBtn.y);
  await js(`(() => { const ed = window.roomplan; const g = ed.selected; g.position.set(1.6, 0, 0.5); })()`);
  await shot(8);

  // 3) Drag it into the corner by the window.
  let p = await toScreen(1.6, 0.3, 0.5);
  const to = { x: 2.85, z: -1.95 };
  await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y, 1);
  for (let i = 1; i <= 14; i++) {
    const t = ease(i / 14);
    const q = await toScreen(1.6 + (to.x - 1.6) * t, 0, 0.5 + (to.z - 0.5) * t);
    await mouse('mouseMoved', q.x, q.y, 1); await shot();
  }
  await mouse('mouseReleased', (await toScreen(to.x, 0, to.z)).x, (await toScreen(to.x, 0, to.z)).y);
  await shot(4);

  // Clear the search so the full catalog is back.
  const clear = await center(`document.querySelector('.search-clear')`);
  await click(clear.x, clear.y);

  // 4) Select a sofa (any piece if the layout has none): recolour it, then
  //    stretch it with the width slider.
  const pick = await js(`(() => { const f = window.roomplan.furniture; const g = f.find(g => g.userData.type === 'sofa') || f.find(g => g.userData.h > 0.3);
    return g ? { x: g.position.x, y: g.position.y + g.userData.h * 0.6, z: g.position.z, w: g.userData.w } : null; })()`);
  if (pick) {
    p = await toScreen(pick.x, pick.y, pick.z);
    await click(p.x, p.y);
    await shot(6);
    if (await js(`!!document.querySelector('.selection-card input[type=color]')`)) {
      for (const color of ['#7a5c9e', '#c9663f', '#3f8a6a']) {
        await js(`(() => { const i = document.querySelector('.selection-card input[type=color]'); i.value = '${color}'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
        await shot(5);
      }
      for (let i = 1; i <= 10; i++) {
        const v = (pick.w + 0.5 * ease(i / 10)).toFixed(2);
        await js(`(() => { const s = [...document.querySelectorAll('.selection-card .field')].find(f => f.textContent.trim().startsWith('Width')).querySelector('input'); s.value = '${v}'; s.dispatchEvent(new Event('input', { bubbles: true })); })()`);
        await shot();
      }
      await shot(6);
    }
    await js('window.roomplan.select(null)');
  }

  // 5) Top-down: wall lengths, then slide the front wall out.
  const topTab = await center(`[...document.querySelectorAll('.view-tabs .tab')][1]`);
  await click(topTab.x, topTab.y);
  await shot(10);
  const fromZ = await js('window.roomplan.room.edgeMid(2).z');
  p = await toScreen(0, 0.05, fromZ);
  await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y, 1);
  for (let i = 1; i <= 12; i++) {
    const q = await toScreen(0, 0, fromZ + 0.6 * ease(i / 12));
    await mouse('mouseMoved', q.x, q.y, 1); await shot();
  }
  const end = await toScreen(0, 0, fromZ + 0.6);
  await mouse('mouseReleased', end.x, end.y);
  await shot(10);

  // 6) Walk: a short first-person stroll through the living room.
  const walkTab = await center(`[...document.querySelectorAll('.view-tabs .tab')][2]`);
  await click(walkTab.x, walkTab.y);
  const path0 = { x: 0.7, z: 2.75 }, path1 = { x: 0.35, z: 1.75 };
  const look0 = { x: -3.1, y: 0.95, z: 1.25 }, look1 = { x: 0.4, y: 1.15, z: -2.3 };
  for (let i = 0; i <= 34; i++) {
    const t = ease(i / 34);
    await js(`(() => { const ed = window.roomplan;
      ed.camera.position.set(${path0.x + (path1.x - path0.x) * t}, 1.6, ${path0.z + (path1.z - path0.z) * t});
      ed.camera.lookAt(${look0.x + (look1.x - look0.x) * t}, ${look0.y + (look1.y - look0.y) * t}, ${look0.z + (look1.z - look0.z) * t}); })()`);
    await shot();
  }
  await shot(6);

  // 7) Back to 3D for the closing shot.
  const persTab = await center(`[...document.querySelectorAll('.view-tabs .tab')][0]`);
  await click(persTab.x, persTab.y);
  for (let i = 0; i < 16; i++) { await orbit(50 - 14 * ease(i / 15)); await shot(); }
  await shot(14);

  console.log('frames', frame);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
}

// Encode: 12 fps, 960 px wide, one shared palette tuned for the dark UI.
const gif = path.resolve('docs/demo.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(FRAMES, 'f%04d.png'),
  '-vf', 'scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle',
  gif]);
console.log('gif', gif, (fs.statSync(gif).size / 1e6).toFixed(2) + ' MB');
