// 60 秒〈字的雁陣〉共用動態元件（唯讀：站點檔只能使用，缺什麼在自己的檔裡做）
// 手法上限（全片）：①落陣 ≤2 次 ②字重呼吸 ≤3 個關鍵字 ③字距展開 ≤2 ④字寬伸展只用在數字 ⑤樓梯落字 ≤2
import React from 'react';
import {getStaticFiles, staticFile} from 'remotion';
import {DirBlur} from '../../lib/components';
import {E, Ease, clamp, prog} from '../../lib/motion';
import {F, G} from '../theme';
import {ANCHOR, BOX} from './world';
import {Cam} from './camera';

export type StationProps = {f: number; cam: Cam};

/** 站點框：子元素用站內座標（0–790 × 0–978），鏡頭停在這站時剛好是閱讀窗 x 90–880、y 270–1248 */
export const StationBox: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
	const a = ANCHOR[id];
	return (
		<div lang="zh-Hant-TW" style={{position: 'absolute', left: a.x - BOX.halfW, top: a.y - BOX.halfH, width: BOX.halfW * 2, height: BOX.halfH * 2}}>
			{children}
		</div>
	);
};

const backOut8: Ease = (t) => {
	// 過衝約 8% 的 backOut
	const s = 1.2;
	const u = t - 1;
	return 1 + (s + 1) * u * u * u + s * u * u;
};

export type Seg = {text: string; color?: string; weight?: number};
const toChars = (segs: Seg[] | string, color: string, weight: number) => {
	const s: Seg[] = typeof segs === 'string' ? [{text: segs}] : segs;
	const out: {ch: string; color: string; weight: number}[] = [];
	for (const x of s) for (const ch of Array.from(x.text)) out.push({ch, color: x.color ?? color, weight: x.weight ?? weight});
	return out;
};

/** ①落陣：一串字排成 V 字飛進來，領頭字先到，兩側往後錯 stagger 格；落地成一行，過衝 8%。 */
export const VDrop: React.FC<{
	f: number;
	text: Seg[] | string;
	land: number; // 領頭字落地的格數（重拍）
	size: number;
	color?: string;
	weight?: number;
	family?: string;
	leader?: number; // 領頭字索引（預設中間）
	from?: {dx: number; dy: number}; // 領頭字起點相對終點的位移
	spread?: number; // 越外側的字落後越多（V 字張開程度）
	stagger?: number;
	dur?: number;
	tracking?: number;
	style?: React.CSSProperties;
}> = ({f, text, land, size, color = G.ink, weight = 900, family = F.round, leader, from = {dx: -520, dy: 360}, spread = 0.22, stagger = 3, dur = 14, tracking = 0, style}) => {
	const chars = toChars(text, color, weight);
	const L = leader ?? Math.floor((chars.length - 1) / 2);
	return (
		<div style={{display: 'flex', whiteSpace: 'pre', lineHeight: 1.12, ...style}}>
			{chars.map((c, i) => {
				const k = Math.abs(i - L);
				const end = land + k * stagger;
				const start = end - dur;
				const pos = (ff: number) => {
					const p = backOut8(clamp((ff - start) / dur));
					const m = 1 + spread * k;
					return {x: from.dx * m * (1 - p), y: from.dy * m * (1 - p)};
				};
				const a = pos(f);
				const b = pos(f + 0.5);
				const c0 = pos(f - 0.5);
				const vx = b.x - c0.x;
				const vy = b.y - c0.y;
				const vis = f >= start - 1;
				return (
					<DirBlur key={i} x={Math.abs(vx) * 0.14} y={Math.abs(vy) * 0.14}>
						<span style={{display: 'inline-block', transform: `translate(${a.x.toFixed(2)}px, ${a.y.toFixed(2)}px)`, opacity: vis ? 1 : 0, fontFamily: family, fontSize: size, fontWeight: c.weight, color: c.color, letterSpacing: `${tracking}em`}}>
							{c.ch}
						</span>
					</DirBlur>
				);
			})}
		</div>
	);
};

/** ②字重呼吸：300 → 900（最重那格＝peak，重拍）→ 700。回傳要用的 fontWeight 數值 */
export const breath = (f: number, peak: number, rise = 14, fall = 12, lo = 300, hi = 900, rest = 700) => {
	if (f < peak - rise) return lo;
	if (f <= peak) return lo + (hi - lo) * E.inOutSine(clamp((f - (peak - rise)) / rise));
	return hi + (rest - hi) * E.outCubic(clamp((f - peak) / fall));
};

/** ③字距展開：0 → em（3 拍左右展開） */
export const tracking = (f: number, start: number, dur: number, em = 0.4) => em * prog(f, start, dur, E.inOutQuart);

/** ④字寬伸展（只用在數字，Anybody font-stretch 50% → 150%） */
export const stretchPct = (f: number, start: number, dur: number, from = 50, to = 150) => from + (to - from) * prog(f, start, dur, E.outExpo);

/** ⑤樓梯落字：一字一階沿斜線落下（dir=1 往右下、-1 往左下），錯 stagger 格 */
export const StairDrop: React.FC<{
	f: number;
	text: Seg[] | string;
	start: number;
	size: number;
	dir?: 1 | -1;
	step?: number; // 每字往下錯幾 px
	color?: string;
	weight?: number;
	family?: string;
	stagger?: number;
	dur?: number;
	style?: React.CSSProperties;
}> = ({f, text, start, size, dir = 1, step = 0, color = G.ink, weight = 900, family = F.round, stagger = 3, dur = 12, style}) => {
	const chars = toChars(text, color, weight);
	return (
		<div style={{position: 'relative', whiteSpace: 'pre', ...style}}>
			{chars.map((c, i) => {
				const s0 = start + i * stagger;
				const p = prog(f, s0, dur, E.outExpo);
				const x = (dir === 1 ? i : chars.length - 1 - i) * size * 1.0;
				const y = i * step;
				return (
					<span
						key={i}
						style={{
							position: 'absolute',
							left: dir === 1 ? x : undefined,
							right: dir === -1 ? x : undefined,
							top: y - (1 - p) * size * 0.9,
							opacity: f >= s0 ? 1 : 0,
							fontFamily: family,
							fontSize: size,
							fontWeight: c.weight,
							color: c.color,
							lineHeight: 1.1,
						}}
					>
						{c.ch}
					</span>
				);
			})}
		</div>
	);
};

/** Mono 工作語言小標：全大寫、字距 +12%，由左往右擦出 */
export const MonoTag: React.FC<{f: number; at: number; text: string; size?: number; color?: string; style?: React.CSSProperties}> = ({f, at, text, size = 36, color = G.ink, style}) => {
	const p = prog(f, at, 12, E.outExpo);
	return (
		<div style={{fontFamily: F.mono, fontWeight: 500, fontSize: size, letterSpacing: '0.12em', textTransform: 'uppercase', color, whiteSpace: 'pre', clipPath: `inset(-10% ${(1 - p) * 100}% -10% 0)`, ...style}}>
			{text}
		</div>
	);
};

/** 淡入上移（附屬句用，不搶戲） */
export const Rise: React.FC<{f: number; at: number; dy?: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({f, at, dy = 24, dur = 14, children, style}) => {
	const p = prog(f, at, dur, E.outExpo);
	return <div style={{opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style}}>{children}</div>;
};

/** 雁 logo（重描檔）：放在 public/geese/logo_ink.png 才會出現；沒有檔案時回傳 null（用店名文字代替） */
export const logoSrc = (variant: 'ink' | 'white' = 'ink') => {
	const name = `geese/logo_${variant}.png`;
	return getStaticFiles().some((s) => s.name === name) ? staticFile(name) : null;
};
