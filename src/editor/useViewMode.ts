import { store } from '../store';
import type { Editor, ViewModeMixin } from './Editor';

// Switching between the perspective, top-down and first-person "walk" views.
export function useViewMode(): ViewModeMixin & ThisType<Editor> {
  return {
    setView(view) {
      const prev = this.view;
      this.view = view;
      store.view = view; // the view tabs render from the store
      if (prev === 'walk' && view !== 'walk' && this.plControls.isLocked) this.plControls.unlock();

      if (view === 'walk') {
        this.controls.enabled = false;
        this.select(null);
        const p = this.interiorPoint();
        this.camera.position.set(p.x, 1.65, p.z);          // eye height
        this.camera.lookAt(p.x, 1.65, p.z - 1);            // face into the room
        this.setReadout('Click to look around · WASD / arrows to move');
        this.handleGroup.visible = false;
        this.wallHandleGroup.visible = false;
        return;
      }

      this.controls.enabled = true;
      if (view === 'top') {
        this.controls.enableRotate = false;
        this.camera.position.set(0, 9, 0.001);
        this.controls.target.set(0, 0, 0);
        this.setReadout('Top-down · drag a wall to move it');
      } else {
        this.controls.enableRotate = true;
        this.camera.position.copy(this.perspectivePos);
        this.controls.target.set(0, 0.5, 0);
        this.setReadout('Drag to orbit · scroll to zoom');
      }
      this.handleGroup.visible = view === 'top';
      this.wallHandleGroup.visible = view === 'top';
      this.controls.update();
    },
  };
}
