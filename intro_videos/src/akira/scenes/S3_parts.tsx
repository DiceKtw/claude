// Akira S3／S4／S5 共用小元件＋幾何工具（只給 g2 這三個場景用）
// - polyline 取樣（描線＋筆尖跟著線頭）
// - FadeRise：淡入＋上移（Akira 的文字進場）
// - InfoCard：S3 的經驗資訊卡（墨黑卡 90%、1px 暖灰 30% 邊、圓角 18、左上米白短槓＋暖灰小標）
import React from 'react';
import {AKIRA, F} from '../../lib/theme';
import {E, Ease, alpha, clamp, prog} from '../../lib/motion';
import {MaskRise} from '../../lib/components';

const C = AKIRA;

export type P = [number, number];

/* ------------------------------------------------------------------ */
/* 幾何：圓弧、三次貝茲取點，組成一條 polyline 再依弧長取樣               */
/* ------------------------------------------------------------------ */
export const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 10): P[] =>
	Array.from({length: n + 1}, (_, i) => {
		const a = a0 + ((a1 - a0) * i) / n;
		return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
	});

export const cubicPts = (a: P, b: P, c: P, d: P, n = 24): P[] =>
	Array.from({length: n + 1}, (_, i) => {
		const t = i / n;
		const u = 1 - t;
		const k0 = u * u * u;
		const k1 = 3 * u * u * t;
		const k2 = 3 * u * t * t;
		const k3 = t * t * t;
		return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]] as P;
	});

const r1 = (v: number) => Math.round(v * 10) / 10;

/** polyline：d 字串、總長、依弧長比例取點（給筆尖用） */
export const poly = (raw: P[]) => {
	// 去掉重複點
	const pts: P[] = [];
	for (const q of raw) {
		const last = pts[pts.length - 1];
		if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) > 0.01) pts.push(q);
	}
	const cum = [0];
	for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	const len = cum[cum.length - 1];
	const d = 'M ' + pts.map((q) => `${r1(q[0])} ${r1(q[1])}`).join(' L ');
	const at = (p: number): P => {
		const s = clamp(p) * len;
		let lo = 0;
		let hi = pts.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (cum[mid] < s) lo = mid;
			else hi = mid;
		}
		const k = cum[hi] > cum[lo] ? (s - cum[lo]) / (cum[hi] - cum[lo]) : 0;
		return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k];
	};
	return {d, len, at};
};

/* ------------------------------------------------------------------ */
/* 淡入＋上移（Akira 文字進場）。不給 start 以前的格數畫任何東西           */
/* ------------------------------------------------------------------ */
export const FadeRise: React.FC<{
	f: number;
	start: number;
	dur?: number;
	rise?: number;
	ease?: Ease;
	fadeOut?: number; // 1→0 的淡出係數（片尾用）
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({f, start, dur = 20, rise = 16, ease = E.outCubic, fadeOut = 1, style, children}) => {
	const p = prog(f, start, dur, ease);
	if (p <= 0 || fadeOut <= 0) return null;
	return (
		<div style={{position: 'absolute', opacity: p * fadeOut, transform: `translateY(${(1 - p) * rise}px)`, ...style}}>{children}</div>
	);
};

/** 等寬小標（F.mono、暖灰、全大寫、字距 0.3em） */
export const monoStyle = (size = 20, tracking = 0.3, color: string = C.muted): React.CSSProperties => ({
	fontFamily: F.mono,
	fontSize: size,
	lineHeight: `${Math.round(size * 1.4)}px`,
	color,
	letterSpacing: `${tracking}em`,
	whiteSpace: 'pre',
});

/* ------------------------------------------------------------------ */
/* S3 經驗資訊卡                                                         */
/* b = 這張卡的拍點；卡身提前 4 格起跑，拍點那格已經上來一半、還在走        */
/* ------------------------------------------------------------------ */
export const CARD_RISE = 24;
export const cardBody = (f: number, b: number) => ({
	p: prog(f, b - 4, 26, E.outQuart),
	op: prog(f, b - 4, 16, E.outCubic),
});

export const InfoCard: React.FC<{
	f: number;
	b: number;
	x: number;
	y: number;
	w: number;
	h: number;
	idx: string;
	tag: string;
	title: string;
	note: string;
	dy?: number; // 定格段的上下漂
}> = ({f, b, x, y, w, h, idx, tag, title, note, dy = 0}) => {
	const {p, op} = cardBody(f, b);
	if (op <= 0) return null;
	// 卡內元素錯開：短槓（描出）→ 標題 → 小標 → 右側小字
	const bar = prog(f, b, 16, E.inOutSine);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y + (1 - p) * CARD_RISE + dy,
				width: w,
				height: h,
				borderRadius: 18,
				background: alpha(C.card, 0.9),
				border: `1px solid ${alpha(C.muted, 0.3)}`,
				boxSizing: 'border-box',
				opacity: op,
			}}
		>
			{/* 左上米白短槓 40×4：由左往右描出 */}
			<div style={{position: 'absolute', left: 36, top: 36, width: 40 * bar, height: 4, background: C.accent}} />
			{/* 小標 01  HAIR */}
			<FadeRise f={f} start={b + 3} dur={18} rise={16} style={{left: 94, top: 24}}>
				<div style={monoStyle(20)}>{`${idx}  ${tag}`}</div>
			</FadeRise>
			{/* 標題 */}
			<div style={{position: 'absolute', left: 34, top: 74}}>
				<MaskRise segments={title} start={b} f={f} size={52} color={C.paper} weight={700} family={F.sans} quiet stagger={3} dur={16} lineHeight={1.2} />
			</div>
			{/* 右側小字 */}
			<div style={{position: 'absolute', right: 38, top: 90, display: 'flex', justifyContent: 'flex-end'}}>
				<MaskRise segments={note} start={b + 8} f={f} size={28} color={C.muted} weight={500} family={F.sans} quiet stagger={2} dur={14} lineHeight={1.3} tracking={0.04} />
			</div>
		</div>
	);
};
