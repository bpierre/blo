// The data structure needed to render an icon.
export type BloImage = [BloImageData, Palette];

// 4x8 grid of the image left side, as 32 PaletteIndex items.
// The right side is omitted as it's a mirror of the left side.
export type BloImageData = Uint8Array;

// Colors used by a given icon.
export type Palette = [
  Hsl, // background
  Hsl, // color
  Hsl, // spot
];

// Points to one of the three Palette colors.
export type PaletteIndex =
  | 0 // background
  | 1 // color
  | 2; // spot

// A color in the HSL color space.
// [0]: 0-360 (hue)
// [1]: 0-100 (saturation)
// [2]: 0-100 (lightness)
export type Hsl = Uint16Array;


// An Ethereum address. (Kept for backward compatibility)
export type Address = `0x${string}`;

// A seed string used.
export type Seed = string | Address;