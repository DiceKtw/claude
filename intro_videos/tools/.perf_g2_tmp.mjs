import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const SP = '/tmp/claude-0/-home-user-claude/d23b88c3-6f9d-576a-b87c-904dbb898651/scratchpad/perf';
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/entries/angus_g2.tsx'), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', chromiumOptions: {gl: 'swangle'}});
const comp = await selectComposition({serveUrl, id: 'Dev', puppeteerInstance: browser});
const r = async (f) => { const t = performance.now(); await renderStill({composition: comp, serveUrl, frame: f, output: `${SP}/m${f}.jpg`, imageFormat: 'jpeg', jpegQuality: 95, puppeteerInstance: browser, overwrite: true}); return performance.now() - t; };
await r(frames[0]);
const out = {};
for (let k = 0; k < 5; k++) for (const f of frames) { const t = await r(f); out[f] = Math.min(out[f] ?? 1e9, t); }
console.log(Object.entries(out).map(([f, t]) => `${f}:${Math.round(t)}`).join('  '));
await browser.close({silent: true});
