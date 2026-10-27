// 60 秒〈字的雁陣〉Overlay（畫面圖層）：拉遠揭曉 → logo 時刻 → 片尾資訊
// 拉遠揭曉（f2700–2957）：不加任何東西，讓字拼成的「>」自己說話。
// logo 時刻（f2957 小節 24 正拍＝鼓組回來）：
//   沒有 logo 檔（目前）：店名字標「雁沙龍 GEESE MODEL HAIR SALON」落在「>」的開口裡（跟封面同一張「雁沙龍 >」），
//   整張字地圖只退到 40%（「>」一直看得到）；小節 24–25 剛好 8 拍＝8 站：每拍沿「>」把一站的那一段筆刷點回 100% 墨
//   （3 格亮起、20 格退到 40% 的殘光留著），鼓組每一下都有畫面，8 拍走完整條「>」——剛走過的 8 件事再點名一次。
//   有 logo 檔：雁 logo 6 格疊溶、地圖退到 12%（logo 疊在「>」上，等檔案到了再看要不要加巡禮）。
// 片尾（f3211 起）：logo／字標上移縮小到 y 300–715，地圖退到 6%（資訊後面不留可讀的鬼影字）；
//   字標版：f3246 英文行重新擦出一次，f3263 起資訊四行一行一行落陣（全片第 2 次、最後一次 VDrop），每半拍一行，
//   四行剛好對上配樂片尾 stab 的後四下；各行左緣排成一個小「>」（錯 64px，看得出是刻意的）。
//   停留時資訊與字標線性慢漂（到最後一格都還在動），f3576 最後一擊：電話號碼字寬 110→124→110「蓋章」。
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
import {TOUR_SEGS} from './Overlay_tour';

const LOGO_AT = ST.LOGO.from; // f2957
const MOVE_AT = ST.END.from - 3; // f3211：提前 3 格起跑，最大位移那幾格壓在小節 26 正拍
const MOVE_DUR = 20;
const HOLD_AT = MOVE_AT + MOVE_DUR; // f3231 片尾停留起點
const FINAL_HIT = 3576; // 配樂最後一擊（大鼓＋貝斯＋A♭6/9）
const X = 112; // 片尾左緣
const STEP = 64; // 樓梯錯位（40 在手機上像沒對齊）
const WM_END = 0.86; // 字標在片尾的縮放（寬 619、高 267，落在 y 448–715）
// 字標在 logo 時刻的位置：「>」的開口裡（跟封面同一個構圖），左緣對齊閱讀窗、「雁沙龍」字高 170px
const WM_A = {left: READ.left + 6, top: 1000, s: 170 / WM.big} as const;
const TOUR = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => b60(92 + k)); // 小節 24–25 的 8 拍：f2957 … f3182
const DIM_LOGO = 0.6; // logo 時刻（字標版）：地圖留 40%
const DIM_END = 0.94; // 片尾：地圖留 6%

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
		{parts: [{text: TEL_LABEL, ...round(48)}, {text: TEL_NUM, size: 64, weight: 900, family: F.num, stretch: 110, pulse: FINAL_HIT}], h: 72, gap: 26},
		{parts: [{text: C60.END.ig, size: 40, weight: 500, family: F.mono, tracking: 0.02}], h: 46, gap: 0},
	];
	// 沒有 logo 檔時，上面的字標已經是「雁沙龍 GEESE MODEL HAIR SALON」，資訊第一行就不重複
	const use = hasLogo ? rows : rows.slice(1);
	// 左緣排成「>」：logo 版 0,1,2,1,0；字標版（字標本身是第 0 階）1,2,1,0
	const steps = hasLogo ? [0, 1, 2, 1, 0] : [1, 2, 1, 0];
	const apex = steps.indexOf(2);
	// 配樂片尾 5 個 stab（f3246／3263／3279／3295／3311）：logo 版 5 行各對一下；
	// 字標版只有 4 行 → 第 1 下給字標的英文行重新擦出，資訊四行對後四下（最高、最有力的第 5 下＝最後一行）
	const first = hasLogo ? 101 : 101.5;
	let y = 780;
	return use.map((r, i) => {
		const line: InfoLine = {
			parts: r.parts,
			x: X + steps[i] * STEP,
			y,
			beat: b60(first + i * 0.5),
			dx: i <= apex ? -50 : 50, // 上半（往右錯）從左下飛進、下半（往左錯）從右下飛進
		};
		y += r.h + r.gap;
		return line;
	});
};

/** 巡禮：第 k 站那一段筆刷的「點亮量」0..1（3 格亮到 1，20 格退到 0.4 的殘光；片尾上移時一起收掉） */
const tourA = (k: number, f: number) => {
	const b = TOUR[k];
	const on = prog(f, b - 2, 3, E.outExpo);
	const settle = prog(f, b + 6, 20, E.inOutSine);
	return on * (1 - 0.6 * settle) * (1 - prog(f, MOVE_AT, MOVE_DUR, E.outExpo));
};

export const Overlay: React.FC<StationProps> = ({f, cam}) => {
	if (f < LOGO_AT - 4) return null;
	const logo = logoSrc('ink');
	const lines = buildLines(logo !== null);
	const mv = prog(f, MOVE_AT, MOVE_DUR, E.outExpo);

	// 整張字地圖退後：雁黃色塊疊上去（字標版 60%＝地圖留 40%；logo 版 88%），片尾再退到 94%
	const base = (logo ? 0.88 : DIM_LOGO) * prog(f, LOGO_AT - 3, 6, E.outExpo);
	const dim = clamp(base + (DIM_END - (logo ? 0.88 : DIM_LOGO)) * mv);
	const tour = !logo && f >= TOUR[0] - 3 && mv < 1;

	// logo／字標的位置：logo 時刻慢推（線性，到上移前都還在推）→ 上移縮小（片尾，outExpo 20 格）→ 片尾停留再慢推一點（線性）
	const pose = (ff: number) => {
		const push = clamp((ff - LOGO_AT) / (HOLD_AT - LOGO_AT));
		const hold = clamp((ff - HOLD_AT) / (3600 - HOLD_AT));
		const m = prog(ff, MOVE_AT, MOVE_DUR, E.outExpo);
		if (logo) {
			// logo 檔：大小約佔畫面高 60%、置中偏上 → 上移縮小到 y 300–700、靠左
			const A = {x: READ.cx - 470, y: 864 - 576, w: 940, h: 1152, px: 50};
			const B = {x: X, y: 300, w: READ.right - X, h: 400, px: 0};
			const s = 1 + 0.03 * push * (1 - m) + 0.02 * hold;
			const w = lerp(A.w, B.w, m);
			const h = lerp(A.h, B.h, m);
			return {x: lerp(A.x, B.x, m) - (w * (s - 1)) / 2, y: lerp(A.y, B.y, m) - (h * (s - 1)) / 2, s, w, h, px: lerp(A.px, B.px, m)};
		}
		// 字標：「>」開口裡（中心不動慢推 4%）→ 上移縮小、左緣對齊片尾樓梯的第 0 階（停留時再慢推 3%，往右下長）
		const sA = WM_A.s * (1 + 0.04 * push);
		const sB = WM_END * (1 + 0.03 * hold);
		const cx = WM_A.left + (WM.w * WM_A.s) / 2;
		const cy = WM_A.top + (WM.h * WM_A.s) / 2;
		const A = {x: cx - (WM.w * sA) / 2, y: cy - (WM.h * sA) / 2};
		const B = {x: X, y: 448};
		return {x: lerp(A.x, B.x, m), y: lerp(A.y, B.y, m), s: lerp(sA, sB, m), w: WM.w, h: WM.h, px: 0};
	};
	const P = pose(f);
	const P0 = pose(f - 0.5);
	const P1 = pose(f + 0.5);
	// 上移那幾格每格走 100px 上下：跟著速度方向模糊（模糊量換算回縮放前的座標）
	const bx = (Math.abs(P1.x - P0.x) * 0.12) / P.s;
	const by = (Math.abs(P1.y - P0.y) * 0.12) / P.s;
	const mark = (
		<div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${P.x.toFixed(2)}px, ${P.y.toFixed(2)}px) scale(${P.s.toFixed(5)})`, transformOrigin: '0 0'}}>
			<DirBlur x={bx} y={by} style={{position: 'relative', width: P.w, height: P.h}}>
				{logo ? (
					<LogoImg src={logo} w={P.w} h={P.h} pos={`${P.px.toFixed(2)}% 50%`} opacity={prog(f, LOGO_AT - 3, 6, E.outExpo)} />
				) : (
					<WordMark f={f} at={LOGO_AT} rewipe={b60(101)} />
				)}
			</DirBlur>
		</div>
	);

	// 片尾停留：資訊整塊往上線性慢漂 28px（跟字標的慢推反方向），到最後一格都還在動。
	// 取整數 px、不開 willChange：合成層的次像素文字在兩個算圖分頁之間會反鋸齒不一致，單雙格交替閃（glitch_scan 會抓）。
	const infoDrift = Math.round(-28 * clamp((f - HOLD_AT) / (3600 - HOLD_AT)));
	const camT = `translate(${(READ.cx - cam.x * cam.zoom).toFixed(2)} ${(READ.cy - cam.y * cam.zoom).toFixed(2)}) scale(${cam.zoom.toFixed(5)})`;
	return (
		<AbsoluteFill lang="zh-Hant-TW" style={{pointerEvents: 'none'}}>
			<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
				{tour ? (
					<defs>
						<mask id="geese60-tour" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
							<rect x={0} y={0} width={1080} height={1920} fill="#fff" />
							{/* 點亮的那一段＝雁黃色塊上挖一個洞（世界座標，跟著鏡頭） */}
							<g transform={camT} fill="#000">
								{TOUR_SEGS.map((seg, k) => {
									const a = tourA(k, f);
									if (a <= 0.005) return null;
									return (
										<g key={k} opacity={a.toFixed(3)}>
											{seg.paths.map((d, j) => (
												<path key={j} d={d} />
											))}
										</g>
									);
								})}
							</g>
						</mask>
					</defs>
				) : null}
				<rect x={0} y={0} width={1080} height={1920} fill={G.yellow} opacity={dim.toFixed(4)} mask={tour ? 'url(#geese60-tour)' : undefined} />
			</svg>
			{mark}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${infoDrift}px)`}}>
				{lines.map((l, i) => (
					<InfoRow key={i} f={f} line={l} />
				))}
			</div>
		</AbsoluteFill>
	);
};
