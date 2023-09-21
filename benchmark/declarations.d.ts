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

declare module "react-blockies" {
  export default function Blockies(props: {
    seed: string;
    size?: number;
    scale?: number;
    color?: string;
    bgColor?: string;
    spotColor?: string;
    className?: string;
  }): JSX.Element;
}
