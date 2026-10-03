// Akira S4 小元件：月曆線稿的幾何與排程
import {rng} from '../../lib/motion';

// 外框 x 110–970、y 430–960；上方一列欄頭，下面 5 列 × 7 欄
export const CAL = {x0: 110, x1: 970, y0: 430, y1: 960, head: 56, cols: 7, rows: 5} as const;
export const COL_W = (CAL.x1 - CAL.x0) / CAL.cols;
export const ROW_Y0 = CAL.y0 + CAL.head;
export const ROW_H = (CAL.y1 - ROW_Y0) / CAL.rows;
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const cellBox = (i: number) => {
	const c = i % CAL.cols;
	const r = Math.floor(i / CAL.cols);
	const x = CAL.x0 + c * COL_W;
	const y = ROW_Y0 + r * ROW_H;
	return {x, y, w: COL_W, h: ROW_H, cx: x + COL_W / 2, cy: y + ROW_H / 2};
};

// 一個月 30 天、從週三開始：前 2 格、後 3 格不屬於這個月（斜線）
export const LEAD = 2;
export const N_DAYS = 30;
export const TRAIL_FROM = LEAD + N_DAYS; // 32

// rng(7) 挑 3 天留空（沒有預約，看起來真實、不是全滿）。避開頭尾幾天；三天不同列、不同星期，才不會排成規律
export const OPEN_DAYS: number[] = (() => {
	const r = rng(7);
	const out: number[] = [];
	const col = (k: number) => (LEAD + k) % 7;
	const row = (k: number) => Math.floor((LEAD + k) / 7);
	let guard = 0;
	while (out.length < 3 && guard++ < 500) {
		const k = 3 + Math.floor(r() * (N_DAYS - 6));
		if (out.every((o) => col(o) !== col(k) && row(o) !== row(k))) out.push(k);
	}
	return out.sort((a, b) => a - b);
})();

/** 45° 斜線（左下往右上），夾在矩形裡；回傳線段 [x1,y1,x2,y2]。線上的點滿足 px + py = k */
export const hatch = (x: number, y: number, w: number, h: number, gap = 16) => {
	const segs: [number, number, number, number][] = [];
	for (let k = x + y + gap / 2; k < x + w + y + h; k += gap) {
		const ax = Math.max(x, k - (y + h));
		const bx = Math.min(x + w, k - y);
		segs.push([ax, k - ax, bx, k - bx]);
	}
	return segs;
};
