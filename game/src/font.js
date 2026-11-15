// Paper Pilot v3 — the pixel font: every letter the game shows, drawn
// as blocks on a 5x7 grid, plus the little pixel icons (heart, shard,
// sun, lock, check, cross, play, arrows). No system font anywhere in
// the game: at the 320x180 pixel resolution the renderer paints at, a
// vector font would smear into mush, while these blocks land exactly
// on the pixel grid and stay crisp when the frame is scaled up 4x.
// One glyph is 5 px wide, 7 tall, with a 1 px gap: a character cell
// is 6 px wide. drawPixelText takes a scale in VIEW px per font px,
// so scale 4 makes a 20x28 px capital on the 1280x720 frame.

const ROWS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '+': ['00000', '00000', '00100', '01110', '00100', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '%': ['10001', '10010', '00100', '01000', '01001', '10001', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  // Bullet: a 2x2 block, for the little separators between stats.
  '•': ['00000', '00000', '01100', '01100', '00000', '00000', '00000'],
};

// Pixel icons, drawn from the same blocks so they match the font.
// Each is a grid of 7 rows; heart/shard/sun/lock are 7 wide, the
// arrows and play triangle too, check and cross as well.
const ICONS = {
  heart: ['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'],
  shard: ['0001000', '0011100', '0111110', '1111111', '0111110', '0011100', '0001000'],
  sun: ['0001000', '0101010', '0011100', '0111110', '0011100', '0101010', '0001000'],
  lock: ['0011100', '0100010', '0100010', '1111111', '1111111', '1111111', '1111111'],
  check: ['0000001', '0000011', '1000110', '1101100', '0111000', '0010000', '0000000'],
  cross: ['1000001', '0100010', '0010100', '0001000', '0010100', '0100010', '1000001'],
  play: ['1000000', '1100000', '1110000', '1111000', '1110000', '1100000', '1000000'],
  up: ['0001000', '0011100', '0111110', '1111111', '0000000', '0000000', '0000000'],
  down: ['0000000', '0000000', '0000000', '1111111', '0111110', '0011100', '0001000'],
};

function paintGrid(ctx, rows, x, y, scale, color) {
  ctx.fillStyle = color;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '1') ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
    }
  }
}

// How wide a string is at a scale, in VIEW px. A character cell is
// 6 font px wide; the last character drops its trailing gap.
export function textWidth(text, scale) {
  const s = String(text).toUpperCase();
  if (!s.length) return 0;
  return s.length * 6 * scale - scale;
}

// Draw text in the pixel font. x is the left edge, the centre, or the
// right edge depending on align; y is the TOP of the capitals. Lower
// case is drawn as upper case; a character with no glyph draws blank.
export function drawPixelText(ctx, text, x, y, scale, color, align = 'left') {
  const s = String(text).toUpperCase();
  const w = textWidth(s, scale);
  let cx = x;
  if (align === 'center') cx = x - w / 2;
  else if (align === 'right') cx = x - w;
  for (let i = 0; i < s.length; i++) {
    const rows = ROWS[s[i]] || ROWS[' '];
    paintGrid(ctx, rows, cx + i * 6 * scale, y, scale, color);
  }
}

// Draw one pixel icon, centred on (cx, cy). Scale is VIEW px per
// icon px, like the font scale.
export function drawIcon(ctx, kind, cx, cy, scale, color) {
  const rows = ICONS[kind];
  if (!rows) return;
  const w = rows[0].length * scale;
  const h = rows.length * scale;
  paintGrid(ctx, rows, cx - w / 2, cy - h / 2, scale, color);
}

// One icon plus the text that follows it, centred as a unit — for
// lines like a shard icon and "12/48 SHARDS". Returns the width used.
export function drawIconText(ctx, kind, text, cx, y, scale, color, iconColor, gap = 8) {
  const iconW = 7 * scale;
  const tw = textWidth(text, scale);
  const total = iconW + gap + tw;
  const x0 = cx - total / 2;
  drawIcon(ctx, kind, x0 + iconW / 2, y + (7 * scale) / 2, scale, iconColor || color);
  drawPixelText(ctx, text, x0 + iconW + gap, y, scale, color, 'left');
  return total;
}
