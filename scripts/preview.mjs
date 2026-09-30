// Writes .cache/preview.html: common icons, original vs Sequel variants, on each panel color.
import { existsSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const names = ['typescript', 'react_ts', 'javascript', 'json', 'java', 'kotlin', 'gradle', 'rust', 'python', 'go', 'html', 'css', 'tailwindcss', 'astro', 'markdown', 'yaml', 'toml', 'docker', 'database', 'git', 'github-actions-workflow', 'biome', 'eslint', 'prettier', 'vite', 'vitest', 'bun', 'nodejs', 'powershell', 'console', 'lock', 'tune', 'image', 'svg', 'pdf', 'readme', 'license', 'folder', 'folder-open', 'folder-src', 'folder-test', 'folder-docs', 'folder-config', 'folder-github', 'folder-node'];
// <img> rather than inline SVG: inline icons share gradient ids and would bleed into each other.
const svg = (dir, n) => (existsSync(`${root}/${dir}/${n}.svg`) ? `<img src="file:///${root}/${dir}/${n}.svg">` : '');
const row = (label, dir, bg, fg) => `<div class="row" style="background:${bg};color:${fg}"><div class="label">${label}</div>${names.map((n) => `<div class="cell" title="${n}">${svg(dir, n)}<span>${n}</span></div>`).join('')}</div>`;
writeFileSync(`${root}/.cache/preview.html`, `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:11px system-ui;background:#000}.row{display:flex;flex-wrap:wrap;gap:6px;padding:14px}.label{width:100%;font-size:13px;margin-bottom:6px}
.cell{width:92px;display:flex;flex-direction:column;align-items:center;gap:4px}.cell img{width:28px;height:28px}.cell span{opacity:.75;font-size:9.5px;text-align:center;overflow:hidden;white-space:nowrap;width:92px;text-overflow:ellipsis}</style>
${row('Material (original) on Ink panel', '.cache/upstream/icons', '#0D0D0C', '#E8E3DB')}
${row('Sequel Ink Icons', 'icons/ink', '#0D0D0C', '#E8E3DB')}
${row('Sequel Void Icons', 'icons/void', '#0D100E', '#D5D9D3')}`);
