// Builds the Sequel icon themes from Material Icon Theme for Zed.
// Run: node scripts/build.mjs   (clones the pinned upstream into .cache/ on first run)
//
// Every icon color is remapped in OKLCH:
//  - hue snaps to the seven hues the Sequel editor themes use, so file types keep
//    their color family (TypeScript blue, Rust orange) but match the editor;
//  - chroma is capped, so icons stay quieter than code;
//  - lightness is compressed into a band that keeps 3:1 against the panel
//    (WCAG 2.2 SC 1.4.11) while preserving light/dark order inside each icon;
//  - neutral colors take the variant's neutral tint; default folders take its accent.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fromOklch, toOklch } from './color.mjs';

export const UPSTREAM = {
  repo: 'https://github.com/zed-extensions/material-icon-theme.git',
  commit: '5ec848638409e4578d9e8c8478041fcab1df15f8',
};

// Hues shared with the Sequel editor themes (status and terminal colors), in OKLCH degrees.
const HUES = [30, 55, 80, 150, 200, 240, 320];

export const variants = {
  ink: {
    name: 'Sequel Ink Icons',
    panel: '#0D0D0C',
    neutral: { C: 0.014, H: 80 },
    folder: '#B3A58E', // gold accent
    lightness: [0.6, 0.86],
    maxChroma: 0.09,
  },
  void: {
    name: 'Sequel Void Icons',
    panel: '#0D100E',
    neutral: { C: 0.012, H: 150 },
    folder: '#55A77A', // emerald accent
    lightness: [0.6, 0.86],
    maxChroma: 0.1,
  },
};

const DEFAULT_FOLDER_ICONS = new Set(['folder.svg', 'folder-open.svg', 'folder-root.svg', 'folder-root-open.svg']);

const expand = (hex) => (hex.length === 4 ? '#' + [...hex.slice(1)].map((c) => c + c).join('') : hex);
const nearestHue = (h) => HUES.reduce((best, x) => (Math.abs(((h - x + 540) % 360) - 180) < Math.abs(((h - best + 540) % 360) - 180) ? x : best));

export function mapColor(hex, v) {
  const [L, C, H] = toOklch(expand(hex));
  const [lo, hi] = v.lightness;
  const L2 = lo + (hi - lo) * Math.min(1, Math.max(0, L));
  if (C < 0.03) return fromOklch(L2, v.neutral.C, v.neutral.H);
  const C2 = Math.min(v.maxChroma, Math.max(0.045, C * 0.6));
  return fromOklch(L2, C2, nearestHue(H));
}

function recolorFolder(svg, v) {
  // Default folders: keep the icon's internal light/dark structure, shifted to the accent hue.
  const [, cA, hA] = toOklch(v.folder);
  return svg.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (m) => {
    const [L] = toOklch(expand(m));
    const [lo, hi] = v.lightness;
    return fromOklch(lo + (hi - lo) * L, Math.min(cA, v.maxChroma + 0.02), hA);
  });
}

function ensureUpstream(root) {
  const dir = `${root}/.cache/upstream`;
  if (!existsSync(dir)) execFileSync('git', ['clone', '-q', UPSTREAM.repo, dir]);
  execFileSync('git', ['-C', dir, 'fetch', '-q', '--depth', '1', 'origin', UPSTREAM.commit]);
  execFileSync('git', ['-C', dir, 'checkout', '-q', UPSTREAM.commit]);
  return dir;
}

export function build(root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')) {
  const src = ensureUpstream(root);
  const upstreamTheme = JSON.parse(readFileSync(`${src}/icon_themes/material-icon-theme.json`, 'utf8')).themes[0];
  const files = readdirSync(`${src}/icons`).filter((f) => f.endsWith('.svg'));
  rmSync(`${root}/icons`, { recursive: true, force: true });

  const themes = [];
  for (const [key, v] of Object.entries(variants)) {
    const out = `${root}/icons/${key}`;
    mkdirSync(out, { recursive: true });
    for (const f of files) {
      const svg = readFileSync(`${src}/icons/${f}`, 'utf8');
      const next = DEFAULT_FOLDER_ICONS.has(f)
        ? recolorFolder(svg, v)
        : svg.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (m) => mapColor(m, v));
      writeFileSync(`${out}/${f}`, next);
    }
    const retarget = (value) => (typeof value === 'string' ? value.replace('./icons/', `./icons/${key}/`) : value);
    const walk = (node) =>
      Array.isArray(node) ? node.map(walk) : node && typeof node === 'object' ? Object.fromEntries(Object.entries(node).map(([k, x]) => [k, walk(x)])) : retarget(node);
    themes.push({ ...walk(upstreamTheme), name: v.name, appearance: 'dark' });
  }

  mkdirSync(`${root}/icon_themes`, { recursive: true });
  writeFileSync(
    `${root}/icon_themes/sequel-icons.json`,
    JSON.stringify({ $schema: 'https://zed.dev/schema/icon_themes/v0.2.0.json', name: 'Sequel Icons', author: 'Sequel', themes }, null, 2) + '\n',
  );
  return { icons: files.length, themes: themes.map((t) => t.name) };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  console.log(build());
}
