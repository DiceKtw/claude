// 30 秒〈一格一位〉鏡頭 H・晚上（小節 11–12，f1125–1350）
// f1125 硬切：那一格（黃、格裡「客」）往下抽出 4 格複本（錯 3 格），越下面墨從上面灌得越滿：
// 黃 → 墨橫條 1/4 → 1/2 → 3/4（黃墨混，只用兩個色票）→ 全墨（格裡黃字「洗」）。格子不標任何時間。
// 拍 2「晚上，附設夜間洗髮。」兩欄直排從右邊推進來，固定不動；
// 之後每一下大鼓把整列往上拽一格（拽得最快那格在拍上），夜越來越深；
// 第 12 小節末鼓抽掉 2 拍：沒人拽了，整列靠慣性繼續往上滑，不停住，直到第 13 小節硬切。
import React from 'react';
import {E, clamp} from '../../../lib/motion';
import {C30} from '../../copy';
import {G} from '../../theme';
import {SH, ShotProps, bar30} from '../kit';
import {Glyph, PaperFast} from './A_parts';
import {Blur, VCol, vel} from './F_parts';

const T0 = SH.H.from; // 1125
const COLX = 220; // 格子列左緣
const S = 420; // 跟開場那一格一樣大
const PITCH = S + 24; // 格與格之間留一道紙縫：一格是一格
const Y1 = 290; // 第一格（黃）上緣
const INK = [0, 0.25, 0.5, 0.75, 1];
const N = INK.length;
const LINE_AT = bar30(11, 2); // 1153
const TUGS = [bar30(11, 3), bar30(11, 4), bar30(12, 1)]; // 1181 1209 1238
const LAST = bar30(12, 2); // 1266：最後一下，之後（1294 起）鼓抽掉、靠慣性滑
const WASH = Array.from(C30.H.line).find((c) => c === '洗') as string; // 「洗」取自文案
const TEXT = {x: 708, y: 470, size: 56};

/** 複本 i 抽出來的進度（錯 3 格，硬切那格第一個複本已在半路） */
const outOf = (i: number, f: number) => (i === 0 ? 1 : E.outExpo(clamp((f - (T0 - 4 + (i - 1) * 3)) / 16)));

/**
 * 整列往上捲：用速度積分（每格一筆，查表）。
 * 速度＝慢漂 1.1px/格（等速，允許）＋每一下大鼓一個鐘形脈衝（峰值正好在拍上）＋
 * 最後一下之後鼓抽掉：沒人拽了，靠慣性滑行、摩擦慢慢減速，但到硬切都還在動。
 */
const PULSE = 240; // 每拽一下的位移
const SIG = 8; // 鐘形寬度（格）
const COAST = {v: 8, tau: 40};
const velAt = (f: number) => {
	let v = 1.1 * clamp((f - T0) / 10); // 慢漂從硬切就開始（10 格內帶起來）
	for (const b of [...TUGS, LAST]) v += (PULSE / (SIG * Math.sqrt(Math.PI))) * Math.exp(-(((f - b) / SIG) ** 2));
	if (f > LAST - 4) v += COAST.v * (1 - Math.exp(-(f - (LAST - 4)) / 4)) * Math.exp(-(f - (LAST - 4)) / COAST.tau);
	return v;
};
const TAB0 = T0 - 8;
const TAB: number[] = (() => {
	const t = [0];
	for (let f = TAB0 + 1; f <= SH.H.to + 8; f++) t.push(t[t.length - 1] + velAt(f));
	return t;
})();
const scroll = (f: number) => {
	const x = clamp(f - TAB0, 0, TAB.length - 1);
	const i = Math.floor(x);
	const j = Math.min(TAB.length - 1, i + 1);
	return TAB[i] + (TAB[j] - TAB[i]) * (x - i);
};

/**
 * 一格：黃底上的墨橫條（像價目表的列），墨覆蓋率 ink＝黃墨混的程度（只用兩個色票，不調中間色）。
 * 每格 6 條，條越粗越暗；ink=1 就是全墨。字放在格子正中。
 */
const BANDS = 6;
const NightCell: React.FC<{x: number; y: number; ink: number; ch?: string; chColor?: string}> = ({x, y, ink, ch, chColor = G.ink}) => {
	const inner = S - 20;
	const p = inner / BANDS;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: S, height: S, boxSizing: 'border-box', border: `10px solid ${G.ink}`, background: ink >= 0.999 ? G.ink : G.yellow, overflow: 'hidden'}}>
			{ink > 0.001 && ink < 0.999
				? Array.from({length: BANDS}, (_, k) => (
						<div key={k} style={{position: 'absolute', left: 0, right: 0, top: k * p + (p * (1 - ink)) / 2, height: p * ink, background: G.ink}} />
					))
				: null}
			{ch ? <Glyph ch={ch} x={inner / 2} y={inner / 2} size={290} color={chColor} /> : null}
		</div>
	);
};

export const H: React.FC<ShotProps> = ({f}) => {
	const sc = scroll(f);

	const cells: React.ReactNode[] = [];
	// 由下往上畫：上面那格壓在下面那格上，複本從它背後抽出來
	for (let i = N - 1; i >= 0; i--) {
		const p = outOf(i, f);
		const y = Y1 + PITCH * i * p;
		// 墨在抽出來之後才灌進去（晚 4 格）
		const ink = INK[i] * (i === 0 ? 1 : E.outCubic(clamp((f - (T0 - 4 + (i - 1) * 3 + 4)) / 14)));
		const ch = i === 0 ? C30.A.ke : i === N - 1 ? WASH : undefined;
		cells.push(<NightCell key={i} x={0} y={y - Y1} ink={ink} ch={ch} chColor={i === N - 1 ? G.yellow : G.ink} />);
	}


	// 兩欄直排：從右邊推進來（第二欄晚 3 格）
	const [c1, c2] = C30.H.line.replace('，', '，\n').split('\n');
	const colX = (k: number, ff: number) => 90 * (1 - E.outExpo(clamp((ff - (LINE_AT - 4 + k * 3)) / 14)));
	const colW = TEXT.size * 1.05;

	return (
		<>
			<PaperFast />
			{/* 整列不掛模糊：峰值速度約 20px／格、墨條週期 67px，不會頻閃；整列高斯模糊一格要多 0.4 秒 */}
			<div style={{position: 'absolute', left: COLX, top: Y1 - sc, width: S, height: PITCH * N + 10}}>{cells}</div>
			{[c1, c2].map((t, k) => {
				if (f < LINE_AT - 4 + k * 3) return null;
				const dx = colX(k, f);
				return (
					<Blur key={k} x={Math.min(12, Math.abs(vel((ff) => colX(k, ff), f)) * 0.2)} w={colW} h={TEXT.size * 8} style={{position: 'absolute', left: TEXT.x + colW * (1 - k) + dx, top: TEXT.y}}>
						<VCol text={t} x={0} y={0} size={TEXT.size} style={{position: 'relative'}} />
					</Blur>
				);
			})}
		</>
	);
};
