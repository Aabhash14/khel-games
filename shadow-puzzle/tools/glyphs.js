// Scan which 3-letter words can be sculpted:  node tools/glyphs.js scan
// Level generator for Umbra: builds voxel sculptures whose axis shadows spell words.
const F7 = {
  A: [".###.","#...#","#...#","#####","#...#","#...#","#...#"],
  H: ["#...#","#...#","#...#","#####","#...#","#...#","#...#"],
  I: ["#####","..#..","..#..","..#..","..#..","..#..","#####"],
  G: [".###.","#...#","#....","#.###","#...#","#...#",".###."],
  O: [".###.","#...#","#...#","#...#","#...#","#...#",".###."],
  K: ["#...#","#..#.","#.#..","##...","#.#..","#..#.","#...#"],
  U: ["#...#","#...#","#...#","#...#","#...#","#...#",".###."],
  P: ["####.","#...#","#...#","####.","#....","#....","#...."],
  N: ["#...#","##..#","##..#","#.#.#","#..##","#..##","#...#"],
  M: ["#...#","##.##","#.#.#","#.#.#","#...#","#...#","#...#"],
  E: ["#####","#....","#....","####.","#....","#....","#####"],
  L: ["#....","#....","#....","#....","#....","#....","#####"],
  T: ["#####","..#..","..#..","..#..","..#..","..#..","..#.."],
  Y: ["#...#","#...#",".#.#.","..#..","..#..","..#..","..#.."],
  S: [".####","#....","#....",".###.","....#","....#","####."],
  W: ["#...#","#...#","#...#","#.#.#","#.#.#","##.##","#...#"],
  B: ["####.","#...#","#...#","####.","#...#","#...#","####."],
  R: ["####.","#...#","#...#","####.","#.#..","#..#.","#...#"],
  D: ["####.","#...#","#...#","#...#","#...#","#...#","####."],
  X: ["#...#","#...#",".#.#.","..#..",".#.#.","#...#","#...#"],
  Z: ["#####","....#","...#.","..#..",".#...","#....","#####"],
  V: ["#...#","#...#","#...#","#...#","#...#",".#.#.","..#.."],
};
const F5 = {
  A: [".###.","#...#","#####","#...#","#...#"],
  B: ["####.","#...#","####.","#...#","####."],
  C: [".####","#....","#....","#....",".####"],
  D: ["####.","#...#","#...#","#...#","####."],
  E: ["#####","#....","####.","#....","#####"],
  F: ["#####","#....","####.","#....","#...."],
  G: [".####","#....","#..##","#...#",".###."],
  H: ["#...#","#...#","#####","#...#","#...#"],
  I: ["#####","..#..","..#..","..#..","#####"],
  J: ["#####","...#.","...#.","#..#.",".##.."],
  K: ["#...#","#..#.","###..","#..#.","#...#"],
  L: ["#....","#....","#....","#....","#####"],
  M: ["#...#","##.##","#.#.#","#...#","#...#"],
  N: ["#...#","##..#","#.#.#","#..##","#...#"],
  O: [".###.","#...#","#...#","#...#",".###."],
  P: ["####.","#...#","####.","#....","#...."],
  R: ["####.","#...#","####.","#..#.","#...#"],
  S: [".####","#....",".###.","....#","####."],
  T: ["#####","..#..","..#..","..#..","..#.."],
  U: ["#...#","#...#","#...#","#...#",".###."],
  V: ["#...#","#...#","#...#",".#.#.","..#.."],
  W: ["#...#","#...#","#.#.#","##.##","#...#"],
  X: ["#...#",".#.#.","..#..",".#.#.","#...#"],
  Y: ["#...#",".#.#.","..#..","..#..","..#.."],
  Z: ["#####","...#.","..#..",".#...","#####"],
};

const grid = rows => rows.map(r => [...r].map(c => c === "#"));
// dihedral transforms of a square/rect grid (only dim-preserving ones allowed for rects)
function transforms(g) {
  const h = g.length, w = g[0].length, out = [];
  const rot = a => a[0].map((_, c) => a.map(r => r[c]).reverse());
  const flip = a => a.map(r => [...r].reverse());
  let cur = g;
  for (let i = 0; i < 4; i++) {
    for (const t of [cur, flip(cur)]) if (t.length === h && t[0].length === w) out.push(t);
    cur = rot(cur);
  }
  return out;
}

// 24 cube rotations as integer 3x3 matrices
function cubeRotations() {
  const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]], out = [];
  for (const p of perms) for (let s = 0; s < 8; s++) {
    const m = [[0,0,0],[0,0,0],[0,0,0]];
    const sg = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
    for (let r = 0; r < 3; r++) m[r][p[r]] = sg[r];
    const det = m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
    if (det === 1) out.push(m);
  }
  return out;
}
const ROTS = cubeRotations();

function frontProjection(vox, dims, m) {
  const [W, H, D] = dims, cells = new Set();
  for (const [i, j, k] of vox) {
    const p = [i - (W-1)/2, j - (H-1)/2, k - (D-1)/2];
    const x = m[0][0]*p[0]+m[0][1]*p[1]+m[0][2]*p[2];
    const y = m[1][0]*p[0]+m[1][1]*p[1]+m[1][2]*p[2];
    cells.add(x + "," + y);
  }
  return cells;
}
function glyphCells(g) {
  const h = g.length, w = g[0].length, s = new Set();
  g.forEach((row, r) => row.forEach((on, c) => { if (on) s.add((c - (w-1)/2) + "," + ((h-1)/2 - r)); }));
  return s;
}
const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
function findRot(vox, dims, g) {
  const t = glyphCells(g);
  return ROTS.findIndex(m => same(frontProjection(vox, dims, m), t));
}

// views: 0 = front (x,y), 1 = side (z,y), 2 = top (x,z)
function build(dims, glyphs) {
  const [W, H, D] = dims, vox = [];
  for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) for (let k = 0; k < D; k++) {
    let on = true;
    const r = H - 1 - j;
    if (glyphs[0]) on = on && glyphs[0][r][i];
    if (glyphs[1]) on = on && glyphs[1][r][k];
    if (glyphs[2]) on = on && glyphs[2][k][i];
    if (on) vox.push([i, j, k]);
  }
  return vox;
}

function solve(word, font, dims) {
  const letters = [...word].map(ch => grid(font[ch]));
  const opts = letters.map(transforms);
  const views = letters.length;
  const pick = (idx) => {
    for (const a of (views > 0 ? opts[0].slice(0, 1) : [null]))
      for (const b of (views > 1 ? opts[1] : [null]))
        for (const c of (views > 2 ? opts[2] : [null])) {
          const vox = build(dims, [a, b, c]);
          if (!vox.length) continue;
          const rots = letters.map(g => findRot(vox, dims, g));
          if (rots.every(r => r >= 0) && new Set(rots).size === rots.length) return { vox, rots };
        }
    return null;
  };
  return pick();
}

const LEVELS = [
  ["A", F7, [5,7,5]],
  ["HI", F7, [5,7,5]],
  ["GO", F7, [5,7,5]],
  ["OK", F7, [5,7,5]],
  ["UP", F7, [5,7,5]],
  ["NO", F7, [5,7,5]],

];
const cands3 = process.argv[2] === "scan";
if (cands3) {
  const words = "SUN ART FUN JOY YES WAX BOX FOX OWL ZEN KEY SKY TEA MAP ICE FIX MIX HUB NUT CUP BUS RUN TOY DOT HAT CAT DOG PIG COW BEE ANT EGG SEA AIR SKI JAM GEM LOW WIN YAY HEY WOW AHA ZAP POP HOP TOP MUD FLY DRY CRY ARC ORB AXE OAK ELF IVY LUX HUE INK PEN RAY SUM".split(" ");
  for (const w of words) {
    if (new Set(w).size < 3) continue;
    const r5 = solve(w, F5, [5,5,5]);
    const r7 = null;
    console.log(w, r5 ? "5x5x5 ok (" + r5.vox.length + ")" : "-", r7 ? "5x7x5 ok (" + r7.vox.length + ")" : "-");
  }
} else {
  const out = [];
  for (const [w, font, dims] of LEVELS) {
    const r = solve(w, font, dims);
    console.log(w, r ? "ok " + r.vox.length : "FAIL");
  }
}
module.exports = { F5, F7, solve, grid };
