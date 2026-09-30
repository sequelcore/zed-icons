// Audits the generated icons. Run after scripts/build.mjs: node scripts/audit.mjs
//  - WCAG 2.2 SC 1.4.11: every color in every icon reaches 3:1 against its panel.
//  - Every path referenced by an icon theme exists.
// Exits non-zero on any failure.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { contrast } from './color.mjs';
import { variants } from './build.mjs';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
let failures = 0;

for (const [key, v] of Object.entries(variants)) {
  const dir = `${root}/icons/${key}`;
  let worst = { ratio: Infinity };
  const colors = new Set();
  for (const f of readdirSync(dir)) {
    for (const c of readFileSync(`${dir}/${f}`, 'utf8').match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
      colors.add(c.toUpperCase());
      const ratio = contrast(c, v.panel);
      if (ratio < worst.ratio) worst = { ratio, color: c, file: f };
      if (ratio < 3) failures++;
    }
  }
  console.log(`${worst.ratio >= 3 ? 'pass' : 'FAIL'}  ${v.name}: ${colors.size} colors, lowest ${worst.ratio.toFixed(2)}:1 (${worst.color} in ${worst.file}) on ${v.panel}`);
}

const themes = JSON.parse(readFileSync(`${root}/icon_themes/sequel-icons.json`, 'utf8')).themes;
const paths = new Set();
const collect = (node) => (typeof node === 'string' ? node.endsWith('.svg') && paths.add(node) : node && typeof node === 'object' && Object.values(node).forEach(collect));
themes.forEach(collect);
const missing = [...paths].filter((p) => !existsSync(`${root}/${p}`));
if (missing.length) failures += missing.length;
console.log(`${missing.length ? 'FAIL' : 'pass'}  ${paths.size} referenced icon paths exist${missing.length ? `; missing: ${missing.slice(0, 5).join(', ')}` : ''}`);

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
