// S4 小元件：小雁陣落下（FlockDrop）、紋理詞點亮（TexFlash）
// 注意：這裡的落下是 S4 自己的小落下（從上方、outBack），不是 kit 的 VDrop（落陣全片只用 2 次）。
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, clamp, mixHex, prog} from '../../../lib/motion';
import {F, G} from '../../theme';

// outBack 第一次碰到 1 的時間點（≈0.37）：用它把「落地那一格」對準拍點
const HIT = (() => {
	let lo = 0;
	let hi = 0.6;
	for (let i = 0; i < 30; i++) {
		const m = (lo + hi) / 2;
		if (E.outBack(m) < 1) lo = m;
		else hi = m;
	}
	return hi;
})();

/** 小雁陣：一行字從上方落下，飛行中排成 V（領頭字最低、最先落地，越外側越高、越晚），落地成一行、outBack 微沉再回。
 *  land＝領頭字落地那一格（拍點）；glide＝飛行時的橫向滑移（正＝從右往左落）。 */
export const FlockDrop: React.FC<{
	f: number;
	text: string;
	land: number;
	size: number;
	leader?: number;
	from?: number; // 領頭字從上方幾 px 落下
	spread?: number; // 每往外一個字，起點再高幾 px
	stagger?: number; // 每往外一個字，晚幾格落地
	dur?: number;
	glide?: number;
	style?: React.CSSProperties;
}> = ({f, text, land, size, leader, from = 120, spread = 16, stagger = 2, dur = 14, glide = 0, style}) => {
	const chars = Array.from(text);
	const L = leader ?? Math.floor((chars.length - 1) / 2);
	return (
		<div style={{display: 'flex', whiteSpace: 'pre', ...style}}>
			{chars.map((ch, i) => {
				const k = Math.abs(i - L);
				const hit = land + k * stagger;
				const start = hit - HIT * dur;
				const pos = (ff: number) => {
					const p = E.outBack(clamp((ff - start) / dur));
					return {x: glide * (1 - p), y: -(from + k * spread) * (1 - p)};
				};
				const a = pos(f);
				const vy = pos(f + 0.5).y - pos(f - 0.5).y;
				const op = clamp((f - start + 1) / 3);
				return (
					<DirBlur key={i} y={Math.abs(vy) * 0.16}>
						<span
							style={{
								display: 'block',
								transform: `translate(${a.x.toFixed(2)}px, ${a.y.toFixed(2)}px)`,
								opacity: op,
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: size,
								lineHeight: 1,
								color: G.ink,
							}}
						>
							{ch}
						</span>
					</DirBlur>
				);
			})}
		</div>
	);
};

/** 紋理詞點亮：一個工作語言紋理詞（34px、500、深黃）在 at 那一格亮成墨色——同時放大到 1.5 倍、字重 500→900
 *  （4 格 outBack 進、停 6 格、8 格退回），再淡回紋理裡。手機上 34px 只剩 12px，只變色看不到；變大變粗才看得出「點亮」。
 *  用 SVG 文字＋雁黃描邊（paint-order）把底下的紋理字讓開一圈，墨字才乾淨。縮放以字的中心為準，位置仍釘在紋理裡那個詞上。 */
export const TexFlash: React.FC<{f: number; at: number; text: string; x: number; y: number; size?: number}> = ({f, at, text, x, y, size = 34}) => {
	if (f < at - 14 || f > at + 34) return null;
	const on = prog(f, at - 4, 4, E.outBack);
	const off = prog(f, at + 6, 8, E.outExpo);
	const k = Math.max(0, on * (1 - off));
	const color = mixHex(G.yellowDeep, G.ink, clamp(k));
	const op = prog(f, at - 14, 10, E.outExpo) * (1 - prog(f, at + 18, 16, E.inExpo));
	const n = Math.max(1, Array.from(text).length);
	const w = Math.ceil(size * n * 1.1) + 16;
	const sc = 1 + 0.5 * k;
	const weight = Math.round(clamp(500 + 400 * k, 100, 900));
	// 字墨中心（相對 svg 左上）：x＝8＋半個字寬，y＝基線上方約 0.42em
	const cx = 8 + (size * n) / 2;
	const cy = size * 1.15 - size * 0.42;
	return (
		<svg width={w} height={size * 1.6} style={{position: 'absolute', left: x - 8, top: y - size * 0.3, overflow: 'visible', opacity: op}}>
			<text
				x={8}
				y={size * 1.15}
				transform={sc !== 1 ? `translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${sc.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})` : undefined}
				fontFamily={F.round}
				fontWeight={weight}
				fontSize={size}
				fill={color}
				stroke={G.yellow}
				strokeWidth={8}
				strokeLinejoin="round"
				paintOrder="stroke fill"
			>
				{text}
			</text>
		</svg>
	);
};
