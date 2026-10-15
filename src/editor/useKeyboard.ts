import type { MoveKeys } from './types';
import type { Editor, KeyboardMixin } from './Editor';

// Global keyboard shortcuts and walk-mode movement keys. This is the keyboard
// half of what the old UI bindings did; the panel controls are Vue components
// now and call editor methods themselves. Every listener is registered with
// the editor's abort signal so dispose() drops them all at once.
export function useKeyboard(): KeyboardMixin & ThisType<Editor> {
  return {
    bindKeys() {
      const signal = this.listenerSignal;

      window.addEventListener('keydown', (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return;
        if (this.view === 'walk') {
          if ((e.key === 'e' || e.key === 'E') && this.plControls.isLocked) this.interactNearestOpening();
          return; // walking uses WASD, not the editor shortcuts
        }
        if (e.key === 'r' || e.key === 'R') this.rotateSelected();
        if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
        if ((e.key === 'd' || e.key === 'D') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.duplicateSelected(); }
        if (e.key === 'Escape') this.select(null);
      }, { signal });

      // Walk-mode movement keys
      const KEYMAP: Partial<Record<string, keyof MoveKeys>> = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
      window.addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (k && this.view === 'walk') { this.move[k] = true; e.preventDefault(); } }, { signal });
      window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) this.move[k] = false; }, { signal });
    },
  };
}
