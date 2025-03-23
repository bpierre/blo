import { createCanvas } from "canvas";

export function canvasPolyfill(global: typeof globalThis) {
  if (typeof global.document === "undefined") {
    global.document = {
      createElement: (tag: string) => {
        if (tag.toLowerCase() === "canvas") {
          return createCanvas(64, 64);
        }
        throw new Error(`createElement called for unsupported tag: ${tag}`);
      },
    } as any;
  }

  if (typeof global.Image === "undefined") {
    global.Image = class Image {
      src: string;
      onload: (() => void) | null;
      onerror: ((error: any) => void) | null;

      constructor() {
        this.src = "";
        this.onload = null;
        this.onerror = null;

        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);

        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error("Image failed to load"));
          }
        }, 0);

        return this;
      }
    } as any;
  }
}
