import type { Editor } from './editor/Editor';

// The live editor is exposed on window for poking at from the devtools console.
declare global {
  interface Window {
    roomplan?: Editor;
  }
}

export {};
