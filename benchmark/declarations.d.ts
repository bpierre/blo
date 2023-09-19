declare module "@download/blockies" {
  export function createIcon(options: {
    seed: string;
    scale: number;
    size: number;
  }): HTMLCanvasElement;
}

declare module "blockies-react-svg/dist/es/BlockiesSvgSync.mjs" {
  export default function BlockiesSvgSync(props: {
    address: string;
    size: number;
    scale: number;
  }): JSX.Element;
}

declare module "blockies-react-svg/dist/es/makeBlockiesUrl.mjs" {
  export default function makeBlockiesUrl(
    address: string,
    size?: number,
    caseSensitive?: boolean,
    scale?: number,
  ): string;
}
