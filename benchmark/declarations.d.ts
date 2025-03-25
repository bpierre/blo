declare module "@download/blockies" {
  export function createIcon(options: {
    seed: string;
    scale: number;
    size: number;
  }): HTMLCanvasElement;
}

declare module "blockies-react-svg/dist/es/makeBlockiesUrl.mjs" {
  export default function makeBlockiesUrl(
    address: string,
    size?: number,
    caseSensitive?: boolean,
    scale?: number,
  ): string;
}

declare module "react-blockies" {
  const Identicon: {
    prototype: {
      generateIdenticon(
        options: { seed: string; size: number; scale: number },
      ): unknown;
    };
  };
  export default Identicon;
}
