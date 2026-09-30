// Writes .cache/preview.html: common Sequel files, upstream vs Sequel variants, on each panel color.
// Icons are resolved through each theme's own suffix, stem and folder maps, the way Zed resolves them.
import { readFileSync, writeFileSync } from 'node:fs';
import { UPSTREAM, variants } from './build.mjs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const upstream = `${root}/.cache/catppuccin`;
const samples = [
  'index.ts', 'App.tsx', 'main.js', 'tsconfig.json', 'Main.java', 'build.gradle.kts', 'lib.rs', 'Cargo.toml',
  'app.py', 'README.md', 'ci.yml', 'global.css', 'index.astro', 'schema.sql', 'deploy.sh', 'logo.svg',
  'Dockerfile', 'package.json', '.gitignore', 'biome.json', '.env', 'bun.lock',
  'folder/', 'src/', 'test/', 'docs/', '.github/', 'node_modules/',
];

function resolve(theme, name) {
  if (name.endsWith('/')) {
    const dir = name.slice(0, -1);
    return theme.named_directory_icons?.[dir]?.collapsed ?? theme.directory_icons.collapsed;
  }
  const stem = theme.file_stems?.[name];
  const parts = name.split('.');
  const suffix = [parts.slice(1).join('.'), parts.at(-1)].map((s) => theme.file_suffixes?.[s]).find(Boolean);
  const id = stem ?? suffix ?? 'default';
  return theme.file_icons?.[id]?.path ?? theme.file_icons?.default?.path;
}

const cell = (base, path, name) =>
  `<div class="cell">${path ? `<img src="file:///${base}/${path.replace(/^\.\//, '')}">` : '<i>·</i>'}<span>${name}</span></div>`;
const row = (label, base, theme, bg, fg) =>
  `<div class="row" style="background:${bg};color:${fg}"><div class="label">${label}</div>${samples.map((n) => cell(base, resolve(theme, n), n)).join('')}</div>`;

const source = JSON.parse(readFileSync(`${upstream}/${UPSTREAM.themeFile}`, 'utf8')).themes.find((t) => t.name === UPSTREAM.theme);
const ours = JSON.parse(readFileSync(`${root}/icon_themes/sequel-icons.json`, 'utf8')).themes;
const byName = Object.fromEntries(ours.map((t) => [t.name, t]));

writeFileSync(
  `${root}/.cache/preview.html`,
  `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:11px system-ui;background:#000}.row{display:flex;flex-wrap:wrap;gap:4px 6px;padding:14px}.label{width:100%;font-size:13px;margin-bottom:8px}
.cell{width:88px;display:flex;flex-direction:column;align-items:center;gap:5px}.cell img{width:22px;height:22px}
.cell span{opacity:.7;font-size:9.5px;text-align:center;overflow:hidden;white-space:nowrap;width:88px;text-overflow:ellipsis}</style>
${row(`${UPSTREAM.theme} (upstream)`, upstream, source, '#1E1E2E', '#CDD6F4')}
${row(variants.ink.name, root, byName[variants.ink.name], variants.ink.panel, '#E8E3DB')}
${row(variants.void.name, root, byName[variants.void.name], variants.void.panel, '#D5D9D3')}`,
);
