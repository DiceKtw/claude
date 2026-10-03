// 安格斯 S4 小元件：成長曲線的數學、描線路徑、等寬小標、量測讀數
import React from 'react';
import {ANGUS, F} from '../../lib/theme';
import {E, clamp, lerp, prog} from '../../lib/motion';

const C = ANGUS;

/* ------------------------------------------------------------------ */
/* 版面（全域格數、畫面像素）                                             */
/* ------------------------------------------------------------------ */
export const CH = {x0: 140, x1: 940, top: 620, base: 1150} as const; // 圖表區
export const FLAT_Y = 1120; // 紅色平線：橫軸上方 30px（剛好是 S0 的地平線高度）
export const BEND_X = 520; // 平線在這裡開始往上彎
export const TIP = {x: 920, y: 660} as const; // 曲線右上端點
export const RULER_X = 960; // 右側量測細軸

export const BEND_AT = 1110; // 落拍：平線開始往上彎
export const CURVE_START = BEND_AT - 1; // 彈出物提前 1 格：落拍那格已經在衝
export const CURVE_DUR = 61; // 一路畫到 1170
export const TIP_AT = 1170; // 端點星芒綻放

/* ------------------------------------------------------------------ */
/* 成長曲線（指數）：u 0..1 沿時間軸                                      */
/* ------------------------------------------------------------------ */
const K = 2.6;
const EK = Math.exp(K) - 1;
export const curveAt = (u: number) => ({
	x: lerp(BEND_X, TIP.x, u),
	y: FLAT_Y - ((FLAT_Y - TIP.y) * (Math.exp(K * u) - 1)) / EK,
});
/** y → u（反函數，給量測點用） */
export const uAtY = (y: number) => Math.log(1 + ((FLAT_Y - y) / (FLAT_Y - TIP.y)) * EK) / K;

/** 筆頭位置（沿時間軸 x 用 outExpo：一出手最快、慢慢停進右上角） */
export const headU = (f: number) => prog(f, CURVE_START, CURVE_DUR, E.outExpo);

/** 預備動作：1104–1110 尾端微微下沉 6px，1110 彈回（outBack 會往上過衝一點點） */
export const dipAt = (f: number) => 6 * prog(f, BEND_AT - 7, 7, E.inOutSine) * (1 - prog(f, BEND_AT - 1, 10, E.outBack));
const dipW = (x: number) => Math.exp(-Math.pow((x - BEND_X) / 90, 2));

/** 平線（畫到 flatP）＋曲線（畫到 u）合成一條路徑 */
export const linePath = (flatP: number, u: number, dip: number) => {
	const pts: [number, number][] = [];
	const xe = lerp(CH.x0, BEND_X, clamp(flatP));
	for (let x = CH.x0; x < xe; x += 12) pts.push([x, FLAT_Y + dip * dipW(x)]);
	pts.push([xe, FLAT_Y + dip * dipW(xe)]);
	if (u > 0 && flatP >= 1) {
		const n = Math.max(2, Math.ceil(u * 72));
		for (let i = 1; i <= n; i++) {
			const p = curveAt((u * i) / n);
			pts.push([p.x, p.y + dip * dipW(p.x)]);
		}
	}
	return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(2)}`).join(' ');
};

/** 某條水平／垂直線的線頭第一次經過 target 的那一格（刻度在那格彈出） */
export const passFrame = (head: (f: number) => number, target: number, f0: number, f1: number, dir: 1 | -1 = 1) => {
	for (let f = f0; f <= f1; f++) if ((head(f) - target) * dir >= -0.5) return f;
	return f1;
};

/* ------------------------------------------------------------------ */
/* 三條量測引線（每拍一條）：曲線上的點 → 右側細軸                         */
/* ------------------------------------------------------------------ */
// 第 1 條跟端點星芒同拍：晚 2 格出手（兄弟元素錯開，星芒是那一拍的主角）
export const READS = [
	{b: 1172, y: 1010, text: '收入'},
	{b: 1200, y: 880, text: '客戶'},
	{b: 1230, y: 750, text: '業績'},
].map((r) => {
	const p = curveAt(uAtY(r.y));
	return {...r, x: p.x};
});

/* ------------------------------------------------------------------ */
/* 等寬小標：由左往右擦出（擦的前緣帶一個 accent 小游標）                    */
/* ------------------------------------------------------------------ */
export const MonoTag: React.FC<{
	x: number; // 左緣（align = right 時是右緣）
	y: number; // 文字中線
	p: number;
	size?: number;
	color: string;
	align?: 'left' | 'right';
	children: React.ReactNode;
}> = ({x, y, p, size = 22, color, align = 'left', children}) => {
	if (p <= 0) return null;
	const pos: React.CSSProperties = align === 'left' ? {left: x} : {right: 1080 - x};
	return (
		<div
			style={{
				position: 'absolute',
				...pos,
				top: y - size * 0.7,
				height: size * 1.4,
				lineHeight: `${size * 1.4}px`,
				fontFamily: F.mono,
				fontSize: size,
				color,
				letterSpacing: '0.04em',
				whiteSpace: 'pre',
				clipPath: `inset(0 ${((1 - clamp(p)) * 100).toFixed(2)}% 0 0)`,
			}}
		>
			{children}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* 量測讀數的細軸節點：accent 小三角（往上指），抵達時彈出、往上一頂          */
/* ------------------------------------------------------------------ */
export const UpTick: React.FC<{x: number; y: number; f: number; at: number}> = ({x, y, f, at}) => {
	const k = prog(f, at, 10, E.outBack);
	if (k <= 0) return null;
	const lift = -6 * (prog(f, at, 6, E.outCubic) - prog(f, at + 6, 12, E.outBack));
	const s = 9 * k;
	return (
		<g transform={`translate(${x} ${y + lift})`}>
			<polygon points={`0,${-s} ${s * 0.9},${s * 0.6} ${-s * 0.9},${s * 0.6}`} fill={C.accent} />
		</g>
	);
};
