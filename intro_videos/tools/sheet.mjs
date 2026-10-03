// 一次算很多格、拼成總表（打包一次，比反覆 remotion still 快很多）
// 用法：
//   node tools/sheet.mjs <entry> <out.png> <start> <end> <step> [cols=6] [scale=0.3]
//   node tools/sheet.mjs <entry> <outDir/> --frames=270,300,330 [scale=1]   ← 輸出多張原尺寸 PNG
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, out, ...rest] = process.argv.slice(2);
if (!entry || !out) {
	console.error('用法見檔頭註解');
	process.exit(1);
}
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
let frames;
let cols = 6;
let scale = 0.3;
const framesArg = rest.find((a) => a.startsWith('--frames='));
if (framesArg) {
	frames = framesArg.slice(9).split(',').map(Number);
	scale = Number(rest.find((a) => !a.startsWith('--')) ?? 1);
} else {
	const [s, e, st] = rest.map(Number);
	cols = Number(rest[3] ?? 6);
	scale = Number(rest[4] ?? 0.3);
	frames = [];
	for (let f = s; f <= e; f += st) frames.push(f);
}

const serveUrl = await bundle({entryPoint: path.resolve(entry), onProgress: () => {}});
const browser = await openBrowser('chrome', {browserExecutable: BROWSER, chromiumOptions: {gl: 'swangle'}});
const comp = await selectComposition({serveUrl, id: 'Dev', puppeteerInstance: browser}).catch(async () => {
	const {getCompositions} = await import('@remotion/renderer');
	const all = await getCompositions(serveUrl, {puppeteerInstance: browser});
	return all[0];
});

const tmp = framesArg ? out : fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
fs.mkdirSync(tmp, {recursive: true});
const files = [];
for (const f of frames) {
	const file = path.join(tmp, `f${String(f).padStart(4, '0')}.png`);
	await renderStill({composition: comp, serveUrl, frame: f, output: file, scale, puppeteerInstance: browser, overwrite: true});
	files.push(file);
}
await browser.close({silent: true});

if (framesArg) {
	console.log(files.join('\n'));
	process.exit(0);
}
// 每張加上格數標籤，再拼成 cols 欄的總表
const labeled = [];
for (const file of files) {
	const f = Number(path.basename(file).slice(1, 5));
	const lf = file.replace('.png', '_l.png');
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-vf',
		`pad=iw+6:ih+34:3:31:0x777777,drawtext=fontfile=/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf:text='f${f}  ${(f / 60).toFixed(2)}s':x=6:y=6:fontsize=20:fontcolor=white`, lf]);
	labeled.push(lf);
}
const rows = Math.ceil(labeled.length / cols);
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, labeled.map((l) => `file '${l}'`).join('\n'));
fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `tile=${cols}x${rows}:padding=4:color=0x333333`, '-frames:v', '1', out]);
console.log(out);
