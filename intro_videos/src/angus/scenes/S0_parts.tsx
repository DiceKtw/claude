// 安格斯 S0 小元件：球的物理、地平線凹陷、等寬小標籤、數字滾動
import React from 'react';
import {E, bounceHeight, clamp, prog} from '../../lib/motion';
import {F} from '../../lib/theme';
import {BALL} from '../timeline';

export const GROUND = BALL.ground; // 1120 地平線
export const GC = BALL.ground - BALL.r; // 1096 球在地上時的中心
export const DROP_Y = 560; // 一開始彈出的高度
export const LANDS = [60, 90, 120, 150, 180, 210];
export const APEX = [75, 105, 135, 165, 195];
export const HOP = 330; // 每次彈跳高度
export const APEX_Y = GC - HOP; // 766
const FALL = 16; // 44 → 60 自由落體
const G_ACC = (2 * (GC - DROP_Y)) / (FALL * FALL);
export const RELEASE = 44;
export const CHARGE0 = 212;
export const LAUNCH = 226;
export const HANDOFF = 230; // iris 圓在 230 半徑≈27（跟球一樣大），球交給 S1 的橘圈

/** 球心 y（可吃小數格，給殘影和速度用） */
export const ballY = (f: number) => {
	if (f < RELEASE) return DROP_Y;
	if (f < LANDS[0]) {
		const t = f - RELEASE;
		return DROP_Y + 0.5 * G_ACC * t * t;
	}
	if (f <= LANDS[LANDS.length - 1]) return GC - bounceHeight(f, LANDS, HOP);
	if (f < LAUNCH) return GC;
	// 226 起向上彈出一點點（一出手最快）；231 起交給 S1 的 iris 圈接手
	// 位移只有幾 px，主要靠拉長（頂端往上竄 ~20px），230 那格 iris 圓剛好跟球一樣大
	return GC - 5 * prog(f, LAUNCH, 6, E.outCubic);
};

export const ballV = (f: number) => ballY(f + 0.5) - ballY(f - 0.5);

/** 蓄力程度（212–226 慢慢壓扁），226 放開 */
export const chargeAt = (f: number) => (f < CHARGE0 || f >= LAUNCH + 1 ? 0 : prog(f, CHARGE0, LAUNCH - CHARGE0, E.inCubic));

/** 落地那格壓扁 1 → 3 格回復 */
export const impactAt = (f: number) => {
	let k = 0;
	for (const L of LANDS) {
		if (f >= L && f < L + 4) k = Math.max(k, 1 - prog(f, L, 3, E.outCubic));
	}
	return k;
};

/** 球的形狀：中心、縮放（壓扁拉長），底部貼地 */
export const ballShape = (f: number) => {
	const y = ballY(f);
	const v = ballV(f);
	// 出場：22–34 在 560 彈出（彈出物提前 1 格）
	const pop = prog(f, 21, 13, E.outBack);
	const k = Math.max(impactAt(f), chargeAt(f) * 0.9);
	// 速度拉長（落地那格速度≈0，所以壓扁最大）
	const st = clamp(Math.abs(v) / 62) * 0.24;
	// 放開那一下拉長
	const launch = f >= LAUNCH + 1 ? (1 - prog(f, LAUNCH + 1, 8, E.outCubic)) * 0.4 : f >= LAUNCH ? 0.18 : 0;
	let sx = (1 + 0.35 * k) * (1 - st * 0.55) * (1 - launch * 0.45);
	let sy = (1 - 0.3 * k) * (1 + st) * (1 + launch);
	sx *= pop;
	sy *= pop;
	return {y, v, sx, sy, pop};
};

/** 地平線在球底下的凹陷（彈床感），落地那格最深，outBack 回彈 */
export const dentAt = (f: number) => {
	let d = 0;
	for (const L of LANDS) if (f >= L && f < L + 14) d = 7 * (1 - prog(f, L, 12, E.outBack));
	// 蓄力時慢慢壓下去，放開彈回
	if (f >= CHARGE0 && f < LAUNCH) d = Math.max(d, 6 * chargeAt(f));
	if (f >= LAUNCH) d = 6 * (1 - prog(f, LAUNCH, 10, E.outBack));
	return d;
};

/** 地平線路徑：x0→x1，球底下高斯凹陷 */
export const horizonPath = (x0: number, x1: number, dent: number) => {
	if (Math.abs(dent) < 0.05 || x1 - x0 < 1) return `M${x0.toFixed(1)} ${GROUND} L${x1.toFixed(1)} ${GROUND}`;
	const pts: string[] = [];
	const step = 6;
	for (let x = x0; x <= x1 + 0.01; x += step) {
		const xx = Math.min(x, x1);
		const y = GROUND + dent * Math.exp(-Math.pow((xx - BALL.x) / 46, 2));
		pts.push(`${pts.length ? 'L' : 'M'}${xx.toFixed(1)} ${y.toFixed(2)}`);
	}
	return pts.join(' ');
};

/** 等寬小標籤：由左往右擦出 */
export const MonoWipe: React.FC<{
	x: number;
	y: number; // 文字中線
	p: number;
	size?: number;
	color: string;
	children: React.ReactNode;
	opacity?: number;
}> = ({x, y, p, size = 26, color, children, opacity = 1}) => {
	if (p <= 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y - size * 0.7,
				height: size * 1.4,
				lineHeight: `${size * 1.4}px`,
				fontFamily: F.mono,
				fontSize: size,
				color,
				whiteSpace: 'pre',
				opacity,
				clipPath: `inset(0 ${((1 - clamp(p)) * 100).toFixed(2)}% 0 0)`,
				display: 'flex',
				alignItems: 'center',
			}}
		>
			{children}
		</div>
	);
};

/** 數字滾動：舊的往上收、新的從遮罩升起。levels[i] 在 at[i] 換上 */
export const RollDigit: React.FC<{
	f: number;
	at: number[];
	values: string[];
	size: number;
	color: string;
}> = ({f, at, values, size, color}) => {
	const h = size * 1.4;
	let cur = -1;
	for (let i = 0; i < at.length; i++) if (f >= at[i] - 4) cur = i;
	if (cur < 0) return null;
	const inP = prog(f, at[cur] - 3, 10, E.outExpo); // 頂點那格已升到 ~85%
	const prev = cur > 0 ? cur - 1 : -1;
	const outP = prog(f, at[cur] - 4, 6, E.inExpo);
	const w = size * 0.6 * Math.max(...values.map((v) => v.length));
	const cell = (txt: string, ty: number, key: string) => (
		<span key={key} style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${ty.toFixed(2)}px)`, color}}>
			{txt}
		</span>
	);
	return (
		<span style={{position: 'relative', display: 'inline-block', width: w, height: h, overflow: 'hidden', verticalAlign: 'top'}}>
			{prev >= 0 && outP < 1 ? cell(values[prev], -outP * h, 'p' + prev) : null}
			{cell(values[cur], (1 - inP) * h, 'c' + cur)}
		</span>
	);
};
