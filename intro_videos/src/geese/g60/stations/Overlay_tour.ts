// 60 秒〈字的雁陣〉logo 時刻的「8 站巡禮」幾何（只給 Overlay.tsx 用）：
// 每一站對應的那一段筆刷（世界座標的 SVG path）＝ 筆刷外框沿筆畫切一段（往外多放 25%，毛邊不會被切到）
// ＋ 這一站的站框（站點的字有些伸出筆刷外，例如頂點 S5 的 ★）。
import {ANCHOR, APEX, BOX, LONG_START, LONG_STROKE, P, SHORT_END, SHORT_STROKE, polyPath} from '../world';

const slice = (poly: P[], a: P, b: P, t0: number, t1: number) => {
	const N = poly.length / 2 - 1; // brushPolygon：前 N+1 點是左緣，後 N+1 點是右緣（倒序）
	const i0 = Math.max(0, Math.round(t0 * N));
	const i1 = Math.min(N, Math.round(t1 * N));
	const c = (i: number): P => ({x: a.x + ((b.x - a.x) * i) / N, y: a.y + ((b.y - a.y) * i) / N});
	const grow = (p: P, i: number): P => {
		const o = c(i);
		return {x: o.x + (p.x - o.x) * 1.25, y: o.y + (p.y - o.y) * 1.25};
	};
	const left: P[] = [];
	const right: P[] = [];
	for (let i = i0; i <= i1; i++) {
		left.push(grow(poly[i], i));
		right.push(grow(poly[2 * N + 1 - i], i));
	}
	return polyPath([...left, ...right.reverse()]);
};
const L = (t0: number, t1: number) => slice(LONG_STROKE, LONG_START, APEX, t0, t1);
const S = (t0: number, t1: number) => slice(SHORT_STROKE, APEX, SHORT_END, t0, t1);
const box = (id: string) => {
	const a = ANCHOR[id];
	return polyPath([
		{x: a.x - BOX.halfW, y: a.y - BOX.halfH},
		{x: a.x + BOX.halfW, y: a.y - BOX.halfH},
		{x: a.x + BOX.halfW, y: a.y + BOX.halfH},
		{x: a.x - BOX.halfW, y: a.y + BOX.halfH},
	]);
};

// 長筆畫上 S1–S5 的位置 t＝0.2/0.4/0.6/0.8/1.0；短筆畫上 S6–S8＝2/7、4/7、6/7
export const TOUR_SEGS: {id: string; paths: string[]}[] = [
	{id: 'S1', paths: [L(0, 0.3), box('S1')]},
	{id: 'S2', paths: [L(0.3, 0.5), box('S2')]},
	{id: 'S3', paths: [L(0.5, 0.7), box('S3')]},
	{id: 'S4', paths: [L(0.7, 0.9), box('S4')]},
	{id: 'S5', paths: [L(0.9, 1), S(0, 1 / 7), box('S5')]},
	{id: 'S6', paths: [S(1 / 7, 3 / 7), box('S6')]},
	{id: 'S7', paths: [S(3 / 7, 5 / 7), box('S7')]},
	{id: 'S8', paths: [S(5 / 7, 1), box('S8')]},
];
