// 雁沙龍字型載入（唯讀）：本機 public/fonts 底下的 Google Fonts 分段檔（unicode-range），
// 開片前用 document.fonts.load 把用到的字載好，載完才開始算圖。
import {continueRender, delayRender, staticFile} from 'remotion';
import FONTS from './fonts.json';

type Face = {family: string; file: string; range: string | null; weight: string; stretch: string | null; fmt: string};

let injected = false;
export const ensureGeeseFonts = (texts: string[]) => {
	if (typeof document === 'undefined') return;
	if (!injected) {
		injected = true;
		const css = (FONTS as Face[])
			.map(
				(f) => `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ''}font-display:block;src:url('${staticFile(f.file)}') format('${f.fmt}');${f.range ? `unicode-range:${f.range};` : ''}}`,
			)
			.join('\n');
		const el = document.createElement('style');
		el.setAttribute('data-geese-fonts', '1');
		el.textContent = css;
		document.head.appendChild(el);
	}
	const all = texts.join('');
	const handle = delayRender('雁沙龍字型載入');
	Promise.all([
		document.fonts.load(`900 100px "Chiron GoRound TC"`, all),
		document.fonts.load(`300 100px "Chiron GoRound TC"`, all),
		document.fonts.load(`900 100px "Anybody"`, '0123456789.,+★@#GEOSMDLHAIRNTXabcdefghijklmnopqrstuvwxyz_-'),
		document.fonts.load(`500 40px "JetBrains Mono"`, 'ABC'),
	])
		.then(() => continueRender(handle))
		.catch(() => continueRender(handle));
};
