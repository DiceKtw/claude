// 60 秒〈字的雁陣〉S1／S2 用的小元件（只給 S1.tsx、S2.tsx 用）
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, Ease, clamp, lerp, prog} from '../../../lib/motion';
import {F, G} from '../../theme';
import {camVelocity} from '../camera';

/** DirBlur 開模糊時 filter 會變成絕對定位的參考框：一律撐滿父框，開關模糊時字才不會跳位 */
export const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'};

export type Box = {x: number; y: number; w: number; h: number};

/**
 * 只在 box（站內座標）這一塊做方向模糊：filter 範圍＝box 外擴 50%，比整個站框小很多，算圖快。
 * 子元素照樣用站內座標排（內層把座標平移回來）；transform 加在外框上（不進 filter）。
 */
export const BlurBox: React.FC<{box: Box; bx?: number; by?: number; transform?: string; children: React.ReactNode}> = ({box, bx = 0, by = 0, transform, children}) => (
	<div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, transform}}>
		<DirBlur x={bx} y={by} style={FULL}>
			<div style={{position: 'absolute', left: -box.x, top: -box.y}}>{children}</div>
		</DirBlur>
	</div>
);

/** 找出 ease 第一次到達 v（預設 0.97）的 t，用來算「提前起跑」幾格 */
export const reachT = (ease: Ease, v = 0.97) => {
	for (let i = 0; i <= 200; i++) if (ease(i / 200) >= v) return i / 200;
	return 1;
};

/** 可調過衝量的 backOut（s=1.2 ≈ 5%、s=0.8 ≈ 2.3%）。t 會先夾在 0..1 */
export const backOut =
	(s: number): Ease =>
	(t) => {
		const u = clamp(t) - 1;
		return 1 + (s + 1) * u * u * u + s * u * u;
	};

/** 鏡頭移站時（每格位移上百 px），站內的字跟著模糊；停留慢漂時不模糊。
 *  移站方向是斜的（700, 1000），等向的 CSS blur 就夠像方向模糊，而且比 SVG filter 快很多。
 *  box＝這一站字的範圍（站內座標）；active=false（字還沒出來）時不開 filter，省算圖。 */
export const CamBlur: React.FC<{f: number; box: Box; active: boolean; children: React.ReactNode}> = ({f, box, active, children}) => {
	const v = active ? camVelocity(f) : {vx: 0, vy: 0};
	const r = Math.min(24, Math.hypot(v.vx, v.vy) * 0.07);
	return (
		<div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, filter: r > 0.3 ? `blur(${r.toFixed(2)}px)` : undefined}}>
			<div style={{position: 'absolute', left: -box.x, top: -box.y}}>{children}</div>
		</div>
	);
};

/** Mono 工作語言字（中文會回退成圓體 500），p＝由左往右擦出的進度 */
export const MonoWord: React.FC<{text: string; x: number; y: number; p: number; size: number; opacity?: number}> = ({text, x, y, p, size, opacity = 1}) => {
	if (p <= 0 || opacity <= 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				fontFamily: F.mono,
				fontWeight: 500,
				fontSize: size,
				lineHeight: 1.2,
				letterSpacing: '0.12em',
				color: G.ink,
				whiteSpace: 'pre',
				opacity,
				clipPath: p >= 1 ? undefined : `inset(-25% ${((1 - p) * 100).toFixed(2)}% -25% -4%)`,
			}}
		>
			{text}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* S1 流程小標：報價 → 確認 → 服務（一階往右下）＋「被擋」的物理梗         */
/* 「服務」搶先衝出，撞上一條細墨線（往回彈 6px）；「確認 →」寫完，線被抽掉， */
/* 「服務」才衝進自己的位置，落在小節 2 正拍。                              */
/* ------------------------------------------------------------------ */
export const FlowStair: React.FC<{
	f: number;
	words: readonly string[];
	x: number; // 第一階左上（站內座標）
	y: number;
	t: {row0: number; row1: number; row1End: number; gateIn: number; rush: number; hit: number; gateOut: number; land: number};
	size?: number;
	stepX?: number;
	stepY?: number;
}> = ({f, words, x, y, t, size = 38, stepX, stepY = 60}) => {
	// 字寬（實測）：中文 1em＋0.12em 字距；JetBrains Mono 的空白與 → 都是 0.6em＋0.12em，→ 的字墨約到 0.6em
	const cw = size * 1.12;
	const arrowEnd = cw * 2 + size * 0.72 + size * 0.6; // 「XX →」箭頭尖端（相對該階左緣）
	const sx0 = stepX ?? Math.round(arrowEnd + 8); // 下一階從上一階箭頭尖端的右下開始
	const r0 = {x, y};
	const r1 = {x: x + sx0, y: y + stepY};
	const r2 = {x: x + sx0 * 2, y: y + stepY * 2};

	// 第一階、第二階：由左往右擦出（第二階「確認」刻意慢，像在確認）
	const p0 = prog(f, t.row0, 12, E.outExpo);
	const p1 = prog(f, t.row1, t.row1End - t.row1, E.inOutSine);

	// 擋線：立在「確認 →」箭頭尖端前面、跨兩階高的一道細牆（箭頭指著牆＝流程被擋住）；
	// 比字高兩倍多，不會被看成打字游標。由上往下落下，抽掉時由下往上收。
	const gx = r1.x + arrowEnd + 10;
	const gy0 = r1.y - 2;
	const gy1 = r2.y + size * 1.3;
	const drop = prog(f, t.gateIn, 7, E.outExpo);
	const pull = prog(f, t.gateOut, 6, E.inExpo); // 抽掉：慢起、最後一下猛抽
	const bow = 6 * Math.sin(Math.PI * clamp((f - t.hit) / 9)) * (f >= t.hit ? 1 : 0);
	const gyEnd = lerp(gy0, gy1, drop * (1 - pull));
	const gyTop = gy0;

	// 「服務」：搶跑（加速）→ 撞線 → 彈回 6px → 往前擠 → 線抽掉後衝進位置（過衝回彈）
	const inkR = cw * 2 - size * 0.16; // 字墨右緣（相對字框左緣）
	const contactX = gx - 3 - inkR;
	const startX = contactX - 92;
	let sx: number;
	if (f < t.hit) sx = lerp(startX, contactX, prog(f, t.rush, t.hit - t.rush, E.inCubic));
	else if (f < t.land - 4) {
		const back = prog(f, t.hit, 5, E.outCubic) * 6;
		const creep = prog(f, t.hit + 5, t.land - 4 - (t.hit + 5), E.inOutSine) * 3;
		sx = contactX - back + creep;
	} else {
		const from = contactX - 3;
		sx = lerp(from, r2.x, backOut(1.6)(clamp((f - (t.land - 4)) / 10)));
	}
	const sxPrev = (ff: number) => {
		if (ff < t.land - 4) return sx;
		return lerp(contactX - 3, r2.x, backOut(1.6)(clamp((ff - (t.land - 4)) / 10)));
	};
	const vx = f >= t.land - 4 ? sxPrev(f + 0.5) - sxPrev(f - 0.5) : 0;
	const sOp = prog(f, t.rush, 4, E.outCubic);

	return (
		<>
			<MonoWord text={`${words[0]} →`} x={r0.x} y={r0.y} p={p0} size={size} />
			<MonoWord text={`${words[1]} →`} x={r1.x} y={r1.y} p={p1} size={size} />
			{f >= t.rush ? (
				<BlurBox box={{x: startX - 16, y: r2.y - 8, w: r2.x + cw * 2 + 40 - (startX - 16), h: size * 1.2 + 16}} bx={Math.abs(vx) * 0.12}>
					<MonoWord text={words[2]} x={sx} y={r2.y} p={1} size={size} opacity={sOp} />
				</BlurBox>
			) : null}
			{drop > 0 && pull < 1 ? (
				<svg width={790} height={978} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<path
						d={`M ${gx} ${gyTop} Q ${gx + bow * 2} ${((gyTop + gyEnd) / 2 + (gyEnd - gyTop) * 0.22).toFixed(2)} ${gx} ${gyEnd.toFixed(2)}`}
						fill="none"
						stroke={G.ink}
						strokeWidth={4}
						strokeLinecap="round"
					/>
				</svg>
			) : null}
		</>
	);
};

/* ------------------------------------------------------------------ */
/* S2 主字：從右側反向進場（右邊的字領頭）                                  */
/* 第一段：三個字擠成一疊（字距各少 squeeze px）從畫面右外側整疊滑進來，    */
/*         最右的「染」撞到位那格＝拍點。                                    */
/* 第二段：「染」停住，前面的「・」「燙」帶著慣性往左彈開到自己的位置。      */
/* 兩段都是同一疊字往同方向走，字墨不會互相穿過。                            */
/* ------------------------------------------------------------------ */
export const FanIn: React.FC<{
	f: number;
	text: string;
	hit: number; // 最右那個字落定的格數（拍點）
	x: number;
	y: number;
	size: number;
	enter: number; // 整疊的起跑位移（往右多少 px，要在畫面外）
	squeeze?: number; // 進場時每個字距被擠掉多少 px
	narrow?: Record<string, number>; // 特定字的字身寬（em），例：・ 0.6
	dur?: number;
}> = ({f, text, hit, x, y, size, enter, squeeze = 40, narrow = {}, dur = 14}) => {
	const chars = Array.from(text);
	const n = chars.length;
	const widths = chars.map((c) => (narrow[c] ?? 1) * size);
	const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
	// 第一段用 outExpo：到 98.5% 那格速度已經很低（不糊），拍點那格字是清楚的；物理感交給第二段的彈開
	const easeA = E.outExpo;
	const s0 = hit - Math.round(dur * reachT(easeA, 0.985)); // 提前起跑：到位那格＝拍點
	const easeB = backOut(1.3);
	// 第一段：整疊共用的位移（三個字一樣快 → 共用一個模糊 filter，算圖省 2/3）
	const posA = (ff: number) => enter * (1 - easeA(clamp((ff - s0) / dur)));
	// 第二段：k=1 在拍點前 1 格放開，k=2 再晚 2 格（兄弟錯格）；慢，不用模糊
	const posB = (k: number, ff: number) => (k === 0 ? 0 : k * squeeze * (1 - easeB(clamp((ff - (hit - 1 + (k - 1) * 2)) / 10))));
	if (f < s0 - 1) return null;
	const vA = Math.abs(posA(f + 0.5) - posA(f - 0.5));
	const word: Box = {x: x - 16, y: y - 8, w: lefts[n - 1] + widths[n - 1] + 32 + squeeze * (n - 1), h: size * 1.12 + 16};
	return (
		<BlurBox box={word} bx={vA > 16 ? vA * 0.13 : 0} transform={`translateX(${posA(f).toFixed(2)}px)`}>
			{chars.map((ch, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: x + lefts[i],
						top: y,
						width: widths[i],
						display: 'flex',
						justifyContent: 'center',
						transform: `translateX(${posB(n - 1 - i, f).toFixed(2)}px)`,
						fontFamily: F.round,
						fontWeight: 900,
						fontSize: size,
						lineHeight: 1.12,
						color: G.ink,
						whiteSpace: 'pre',
					}}
				>
					{ch}
				</div>
			))}
		</BlurBox>
	);
};
