// 60 秒〈字的雁陣〉Overlay（畫面圖層）：拉遠揭曉 → logo 時刻 → 片尾資訊
// 拉遠揭曉（f2700–2957）：不加任何東西，讓字拼成的「>」自己說話。
// logo 時刻（f2957 小節 24 正拍＝鼓組回來）：雁黃 88% 色塊疊上去，整張字地圖退到 12% 當底紋；
//   雁 logo（客戶檔）6 格疊溶出現；沒有檔案時改成店名字標（雁沙龍＋GEESE MODEL HAIR SALON），一字一字落定。
// 片尾（f3214 起）：logo／字標上移縮小到 y 300–700；f3246 起資訊一行一行落陣（全片第 2 次、最後一次 VDrop），
//   每行錯半拍；各行左緣排成一個小「>」（上半往右錯、下半往左錯，跟八站的樓梯同一套規則）。
//   最後一格停在完整片尾（雁黃底，接回第 0 格）。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DirBlur} from '../../../lib/components';
import {E, clamp, lerp, prog} from '../../../lib/motion';
import {C60} from '../../copy';
import {F, G, READ, b60} from '../../theme';
import {StationProps, logoSrc} from '../kit';
import {ST} from '../timeline';
import {InfoLine, InfoRow, LogoImg, WM, WordMark} from './Overlay_parts';

const LOGO_AT = ST.LOGO.from; // f2957
const MOVE_AT = ST.END.from - 3; // f3211：提前 3 格起跑，最大位移那幾格壓在小節 26 正拍
const MOVE_DUR = 20;
const X = 112; // 片尾左緣
const STEP = 40; // 樓梯錯位
const WM_END = 0.76; // 字標在片尾的縮放（寬 547、高 236，落在 y 448–684）

const [TEL_LABEL, ...TEL_REST] = C60.END.tel.split(' ');
const TEL_NUM = TEL_REST.join(' ');

const round = (size: number, weight = 500) => ({size, weight, family: F.round});
const buildLines = (hasLogo: boolean): InfoLine[] => {
	const rows: {parts: InfoLine['parts']; h: number; gap: number}[] = [
		{
			parts: [{text: C60.END.name, ...round(64, 900)}, {text: C60.END.en, size: 40, weight: 900, family: F.num, stretch: 72, tracking: 0.06}],
			h: 72,
			gap: 26,
		},
		{parts: [{text: C60.END.night, ...round(48)}], h: 54, gap: 28},
		{parts: [{text: C60.END.addr, ...round(44)}], h: 50, gap: 28},
		{parts: [{text: TEL_LABEL, ...round(48)}, {text: TEL_NUM, size: 64, weight: 900, family: F.num, stretch: 110}], h: 72, gap: 26},
		{parts: [{text: C60.END.ig, size: 40, weight: 500, family: F.mono, tracking: 0.02}], h: 46, gap: 0},
	];
	// 沒有 logo 檔時，上面的字標已經是「雁沙龍 GEESE MODEL HAIR SALON」，資訊第一行就不重複
	const use = hasLogo ? rows : rows.slice(1);
	// 左緣排成「>」：logo 版 0,1,2,1,0；字標版（字標本身是第 0 階）1,2,1,0
	const steps = hasLogo ? [0, 1, 2, 1, 0] : [1, 2, 1, 0];
	const apex = steps.indexOf(2);
	let y = 780;
	return use.map((r, i) => {
		const line: InfoLine = {
			parts: r.parts,
			x: X + steps[i] * STEP,
			y,
			beat: b60(101 + i * 0.5), // f3246 起每半拍一行
			dx: i <= apex ? -50 : 50, // 上半（往右錯）從左下飛進、下半（往左錯）從右下飛進
		};
		y += r.h + r.gap;
		return line;
	});
};

export const Overlay: React.FC<StationProps> = ({f}) => {
	if (f < LOGO_AT - 4) return null;
	const logo = logoSrc('ink');
	const lines = buildLines(logo !== null);

	// 整張字地圖退到 12%：雁黃 88% 色塊，跟 logo 一起 6 格疊溶
	const dim = 0.88 * prog(f, LOGO_AT - 3, 6, E.outExpo);
	// logo／字標的位置：慢推（logo 時刻）→ 上移縮小（片尾，outExpo 20 格）→ 片尾停留再慢推一點
	const pose = (ff: number) => {
		const push = prog(ff, LOGO_AT, ST.END.from - LOGO_AT, E.inOutSine);
		const hold = prog(ff, MOVE_AT + MOVE_DUR, 3600 - (MOVE_AT + MOVE_DUR), E.inOutSine);
		const mv = prog(ff, MOVE_AT, MOVE_DUR, E.outExpo);
		if (logo) {
			// logo 檔：大小約佔畫面高 60%、置中偏上 → 上移縮小到 y 300–700、靠左
			const A = {x: READ.cx - 470, y: 864 - 576, w: 940, h: 1152, px: 50};
			const B = {x: X, y: 300, w: READ.right - X, h: 400, px: 0};
			const s = 1 + 0.012 * push * (1 - mv) + 0.008 * hold;
			const w = lerp(A.w, B.w, mv);
			const h = lerp(A.h, B.h, mv);
			return {x: lerp(A.x, B.x, mv) - (w * (s - 1)) / 2, y: lerp(A.y, B.y, mv) - (h * (s - 1)) / 2, s, w, h, px: lerp(A.px, B.px, mv)};
		}
		// 字標：置中在 y≈760 → 上移縮小、左緣對齊片尾樓梯的第 0 階
		const sA = 1 + 0.012 * push;
		const sB = WM_END * (1 + 0.01 * hold);
		const A = {x: READ.cx - (WM.w * sA) / 2, y: 760 - (WM.h * sA) / 2};
		const B = {x: X, y: 448 - (WM.h * (sB - WM_END)) / 2};
		return {x: lerp(A.x, B.x, mv), y: lerp(A.y, B.y, mv), s: lerp(sA, sB, mv), w: WM.w, h: WM.h, px: 0};
	};
	const P = pose(f);
	const P0 = pose(f - 0.5);
	const P1 = pose(f + 0.5);
	// 上移那幾格每格走 100px 上下：跟著速度方向模糊（模糊量換算回縮放前的座標）
	const bx = (Math.abs(P1.x - P0.x) * 0.12) / P.s;
	const by = (Math.abs(P1.y - P0.y) * 0.12) / P.s;
	const hold = prog(f, MOVE_AT + MOVE_DUR, 3600 - (MOVE_AT + MOVE_DUR), E.inOutSine);
	const mark = (
		<div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${P.x.toFixed(2)}px, ${P.y.toFixed(2)}px) scale(${P.s.toFixed(5)})`, transformOrigin: '0 0'}}>
			<DirBlur x={bx} y={by} style={{position: 'relative', width: P.w, height: P.h}}>
				{logo ? (
					<LogoImg src={logo} w={P.w} h={P.h} pos={`${P.px.toFixed(2)}% 50%`} opacity={prog(f, LOGO_AT - 3, 6, E.outExpo)} />
				) : (
					<WordMark f={f} at={LOGO_AT} />
				)}
			</DirBlur>
		</div>
	);

	// 片尾停留：資訊整塊往上慢漂 8px，跟 logo 的慢推反方向（定格也不死）
	const infoDrift = -8 * hold;
	return (
		<AbsoluteFill lang="zh-Hant-TW" style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: G.yellow, opacity: clamp(dim)}} />
			{mark}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${infoDrift.toFixed(2)}px)`}}>
				{lines.map((l, i) => (
					<InfoRow key={i} f={f} line={l} />
				))}
			</div>
		</AbsoluteFill>
	);
};
