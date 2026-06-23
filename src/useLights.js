import * as THREE from 'three';

// Ceiling lights: creation and brightness/color controls.
export function useLights() {
  return {
    makeCeilingLight() {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888 })));                       // ceiling canopy
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 22, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xf4f1e8, emissive: 0xfff0c0, emissiveIntensity: 1, side: THREE.DoubleSide }));
      shade.position.y = -0.15;
      g.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 1.3 }));
      bulb.position.y = -0.2;
      g.add(bulb);
      const light = new THREE.PointLight(0xfff0d0, 12, 13, 2); // wider range → softer, more natural falloff
      light.position.y = -0.22;
      g.add(light);
      g.userData = { isLight: true, type: 'ceiling-light', label: 'Ceiling light', intensity: 12, color: 0xfff0d0, light, shade, bulb, on: true };
      return g;
    },

    addCeilingLight(pos) {
      const g = this.makeCeilingLight();
      const p = pos ?? this.interiorPoint();
      g.position.set(p.x, this.room.height - 0.02, p.z);
      this.scene.add(g);
      this.lights.push(g);
      this.select(g);
      return g;
    },

    setLightIntensity(v) {
      const g = this.selected;
      if (!g || !g.userData.isLight) return;
      g.userData.intensity = v;
      g.userData.light.intensity = v;
      g.userData.shade.material.emissiveIntensity = Math.min(1.3, 0.2 + v / 16);
      document.getElementById('light-int-val').textContent = +v.toFixed(1);
    },

    setLightColor(hex) {
      const g = this.selected;
      if (!g || !g.userData.isLight) return;
      g.userData.color = hex;
      g.userData.light.color.setHex(hex);
      document.querySelectorAll('#light-swatches .swatch').forEach((s) =>
        s.classList.toggle('active', Number(s.dataset.hex) === hex));
    },

    // Turn a ceiling light's emission on/off without losing its brightness/color settings.
    toggleLight() {
      const g = this.selected;
      if (!g || !g.userData.isLight) return;
      const on = !g.userData.on;
      g.userData.on = on;
      g.userData.light.visible = on;
      g.userData.shade.material.emissiveIntensity = on ? Math.min(1.3, 0.2 + g.userData.intensity / 16) : 0.05;
      g.userData.bulb.material.emissiveIntensity = on ? 1.3 : 0.1;
      this.updateInspector();
    },
  };
}
