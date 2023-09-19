import { bloImage } from "blo";

const SQUARE_WIDTH = 3;

function renderImage([data, palette]: ReturnType<typeof bloImage>) {
  let output = "";
  const currentLine: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const color = hsl2rgb(
      palette[data[i]][0],
      palette[data[i]][1] / 100,
      palette[data[i]][2] / 100,
    );

    const [r, g, b] = color.map((c) => Math.floor(c * 255));

    currentLine[
      i % 4
    ] = `\x1b[48;2;${r};${g};${b}m${" ".repeat(SQUARE_WIDTH)}\x1b[0m`;

    if (i % 4 === 3) {
      output += currentLine.join("");
      output += currentLine.reverse().join("");
      output += "\n";
    }
  }
  return output;
}

function renderIcon(address: `0x${string}`) {
  console.log(
    renderImage(bloImage(address)),
    `\n${address}`,
  );
}

// https://stackoverflow.com/a/64090995
// input: h as an angle in [0,360] and s,l in [0,1]
// output: r,g,b in [0,1]
function hsl2rgb(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => (
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  );
  return [f(0), f(8), f(4)];
}

renderIcon("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
