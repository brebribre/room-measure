import { rebuildWall } from './walls';
import type { Editor, RoomEditsMixin } from './Editor';

// Room settings from the inspector: shape, bounding size, height, finishes and
// colours. These used to be inline input handlers in the UI bindings; the
// panel now passes the control's value in, and the readouts go back out
// through the store (syncRoom) instead of being written into labels here.
export function useRoomEdits(): RoomEditsMixin & ThisType<Editor> {
  return {
    setRoomShape(shape) {
      this.room.setShape(shape);
      this.afterRoomChange();
    },

    // Scale the polygon to the target bounding width, and the interior walls
    // with it so they stay where they were relative to the room.
    setRoomWidth(target) {
      const f = target / (this.room.bboxWidth || 1);
      this.room.scaleWidthTo(target);
      this.walls.forEach((w) => { w.userData.a[0] *= f; w.userData.b[0] *= f; rebuildWall(w); });
      this.afterRoomChange(false);
    },

    setRoomLength(target) {
      const f = target / (this.room.bboxLength || 1);
      this.room.scaleLengthTo(target);
      this.walls.forEach((w) => { w.userData.a[1] *= f; w.userData.b[1] *= f; rebuildWall(w); });
      this.afterRoomChange(false);
    },

    setRoomHeight(v) {
      this.room.setHeight(v);
      this.walls.forEach((w) => { w.userData.height = v; rebuildWall(w); });
      this.refreshOpenings();
      this.lights.forEach((l) => { l.position.y = this.room.height - 0.02; }); // keep on the ceiling
      this.syncRoom();
    },

    setFloorFinish(f) {
      this.room.setFloorFinish(f);
      this.syncRoom();
    },

    setWallFinish(f) {
      this.room.setWallFinish(f);
      this.syncRoom();
    },

    setFloorColor(hex) {
      this.room.setFloorColor(hex);
      this.syncRoom();
    },

    setWallColor(hex) {
      this.room.setWallColor(hex);
      this.syncRoom();
    },
  };
}
