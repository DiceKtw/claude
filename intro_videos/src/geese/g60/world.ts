// 60 秒〈字的雁陣〉字地圖幾何（唯讀）
// 整支片是一張大「字地圖」（世界座標，單位＝px，鏡頭 zoom 1 時 1:1）。
// 地圖形狀是雁 logo 的「>」：上臂＝長筆畫（左上 → 頂點），下臂＝短筆畫（頂點 → 左下）。
// 8 個站點沿兩道筆畫的中心線排成樓梯；鏡頭一鏡到底沿著走。
import {rng} from '../../lib/motion';

export type P = {x: number; y: number};

export const APEX: P = {x: 2800, y: 4000}; // 「>」頂點（站 5 在這裡）
export const LONG_START: P = {x: -700, y: -1000}; // 長筆畫起筆（站 1 之前還有一段，只在拉遠時看得到）
export const SHORT_END: P = {x: 350, y: 7500}; // 短筆畫收筆
export const BAND = 1100; // 筆畫寬（垂直於中心線）

// 站點錨點：鏡頭停在站 i 時，錨點會落在閱讀窗中心 (485, 759)。
// 每站的字必須放在錨點周圍 x ±395、y ±489 的框內（＝閱讀窗 x 90–880、y 270–1248），
// 相鄰兩站上下差 1000（> 978），所以字框不會互相重疊。
export const ANCHOR: Record<string, P> = {
	S1: {x: 0, y: 0},
	S2: {x: 700, y: 1000},
	S3: {x: 1400, y: 2000},
	S4: {x: 2100, y: 3000},
	S5: {x: 2800, y: 4000},
	S6: {x: 2100, y: 5000},
	S7: {x: 1400, y: 6000},
	S8: {x: 700, y: 7000},
};
export const BOX = {halfW: 395, halfH: 489} as const;

// 樓梯方向：上臂（S1–S5）每往下一行往右錯位；下臂（S6–S8）每往下一行往左錯位。
// 斜率＝筆畫方向（每往下 1000 px，水平移 700 px）→ 每往下 100 px 錯位 70 px。
export const STAIR = 0.7;
export const stairDir = (station: string) => (['S6', 'S7', 'S8'].includes(station) ? -1 : 1);

/** 一道筆刷的外框（多邊形）：入筆略細、收筆乾筆漸細，邊緣有固定亂數的毛邊。 */
export const brushPolygon = (a: P, b: P, width: number, seed: number, entry = 0.6, exit = 0.32) => {
	const r = rng(seed);
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len = Math.hypot(dx, dy);
	const ux = dx / len;
	const uy = dy / len;
	const nx = -uy;
	const ny = ux;
	const N = 64;
	const left: P[] = [];
	const right: P[] = [];
	for (let i = 0; i <= N; i++) {
		const t = i / N;
		let prof = 1;
		if (t < 0.1) prof = entry + (1 - entry) * Math.sin((t / 0.1) * (Math.PI / 2));
		if (t > 0.72) prof = 1 - (1 - exit) * Math.pow((t - 0.72) / 0.28, 1.4);
		const jitterL = 1 + (r() - 0.5) * 0.06;
		const jitterR = 1 + (r() - 0.5) * 0.06;
		const cx = a.x + dx * t;
		const cy = a.y + dy * t;
		const h = (width / 2) * prof;
		left.push({x: cx + nx * h * jitterL, y: cy + ny * h * jitterL});
		right.push({x: cx - nx * h * jitterR, y: cy - ny * h * jitterR});
	}
	return [...left, ...right.reverse()];
};

export const LONG_STROKE = brushPolygon(LONG_START, APEX, BAND, 11, 0.55, 0.62);
export const SHORT_STROKE = brushPolygon(APEX, SHORT_END, BAND * 0.92, 23, 0.7, 0.3);
export const polyPath = (pts: P[]) => 'M ' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') + ' Z';

// 整張地圖的外框與拉遠時的鏡頭
export const MAP = (() => {
	const pts = [...LONG_STROKE, ...SHORT_STROKE];
	const minX = Math.min(...pts.map((p) => p.x));
	const maxX = Math.max(...pts.map((p) => p.x));
	const minY = Math.min(...pts.map((p) => p.y));
	const maxY = Math.max(...pts.map((p) => p.y));
	return {minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY};
})();
// 拉遠後整張地圖剛好塞進 1080×1920（上下各留 40px）
export const REVEAL_ZOOM = Math.min(1000 / MAP.w, 1840 / MAP.h);
