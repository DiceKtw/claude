// 轉場（唯讀）。由 Master 套在場景外面，場景檔不用自己處理轉場。
// 「In」＝新場景在上面、慢慢露出；「Out」＝舊場景在上面、被移走露出下面的新場景。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {H, W} from './theme';
import {E, clamp, lerp, prog} from './motion';
import {DirBlur} from './components';

export type Transition =
	| {type: 'cut'}
	| {type: 'iris'; t0: number; t1: number; cx: number; cy: number} // In：圓從某點張開
	| {type: 'fill'; t0: number; t1: number; x: number; y: number; w: number; h: number; r: number} // In：從某個框放大填滿
	| {type: 'blinds'; t0: number; t1: number; n?: number} // Out：切成 n 條橫條左右甩出
	| {type: 'slide'; t0: number; t1: number} // Out：往左甩出、水平模糊
	| {type: 'lineWipe'; t0: number; t1: number; dir: 'down' | 'right'; color: string} // In：一條細線掃過、線後面是新場景
	| {type: 'lift'; t0: number; t1: number} // Out：往上漂 80px 並淡出（Akira）
	| {type: 'dissolve'; t0: number; t1: number}; // In：淡入

/** 套在「新場景」上（In 類） */
export const InWrap: React.FC<{f: number; tr: Transition; children: React.ReactNode}> = ({f, tr, children}) => {
	switch (tr.type) {
		case 'iris': {
			const p = prog(f, tr.t0, tr.t1 - tr.t0, E.inOutQuart);
			const far = Math.hypot(Math.max(tr.cx, W - tr.cx), Math.max(tr.cy, H - tr.cy));
			if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
			return <AbsoluteFill style={{clipPath: `circle(${(far * p).toFixed(1)}px at ${tr.cx}px ${tr.cy}px)`}}>{children}</AbsoluteFill>;
		}
		case 'fill': {
			const p = prog(f, tr.t0, tr.t1 - tr.t0, E.inOutExpo);
			if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
			const top = lerp(tr.y, 0, p);
			const left = lerp(tr.x, 0, p);
			const right = lerp(W - tr.x - tr.w, 0, p);
			const bottom = lerp(H - tr.y - tr.h, 0, p);
			const r = lerp(tr.r, 0, p);
			return <AbsoluteFill style={{clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`}}>{children}</AbsoluteFill>;
		}
		case 'lineWipe': {
			const p = prog(f, tr.t0, tr.t1 - tr.t0, E.inOutSine); // 安靜的掃線：峰值速度比 inOutQuart 慢一半以上
			if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
			const pos = tr.dir === 'down' ? H * p : W * p;
			const clip = tr.dir === 'down' ? `inset(0 0 ${H - pos}px 0)` : `inset(0 ${W - pos}px 0 0)`;
			return (
				<>
					<AbsoluteFill style={{clipPath: clip}}>{children}</AbsoluteFill>
					{p > 0 ? (
						<AbsoluteFill style={{pointerEvents: 'none'}}>
							<svg width={W} height={H}>
								{tr.dir === 'down' ? (
									<line x1={0} y1={pos} x2={W} y2={pos} stroke={tr.color} strokeWidth={2} />
								) : (
									<line x1={pos} y1={0} x2={pos} y2={H} stroke={tr.color} strokeWidth={2} />
								)}
							</svg>
						</AbsoluteFill>
					) : null}
				</>
			);
		}
		case 'dissolve': {
			const p = prog(f, tr.t0, tr.t1 - tr.t0, E.inOutSine);
			return <AbsoluteFill style={{opacity: p}}>{children}</AbsoluteFill>;
		}
		default:
			return <AbsoluteFill>{children}</AbsoluteFill>;
	}
};

/** 套在「舊場景」上（Out 類） */
export const OutWrap: React.FC<{f: number; tr: Transition; children: React.ReactNode}> = ({f, tr, children}) => {
	switch (tr.type) {
		case 'blinds': {
			if (f < tr.t0) return <AbsoluteFill>{children}</AbsoluteFill>;
			const n = tr.n ?? 6;
			const sh = H / n;
			const span = tr.t1 - tr.t0;
			const stagger = 2;
			const each = span - stagger * (n - 1);
			return (
				<AbsoluteFill>
					{Array.from({length: n}, (_, i) => {
						const dir = i % 2 === 0 ? -1 : 1;
						const xAt = (ff: number) => dir * W * 1.1 * prog(ff, tr.t0 + i * stagger, each, E.inExpo);
						const x = xAt(f);
						const v = xAt(f + 0.5) - xAt(f - 0.5);
						if (Math.abs(x) >= W * 1.09) return null;
						return (
							<AbsoluteFill key={i} style={{clipPath: `inset(${i * sh}px 0 ${H - (i + 1) * sh}px 0)`}}>
								<DirBlur x={Math.abs(v) * 0.25} style={{position: 'absolute', inset: 0, transform: `translateX(${x}px)`}}>
									<AbsoluteFill>{children}</AbsoluteFill>
								</DirBlur>
							</AbsoluteFill>
						);
					})}
				</AbsoluteFill>
			);
		}
		case 'slide': {
			const xAt = (ff: number) => -W * 1.1 * prog(ff, tr.t0, tr.t1 - tr.t0, E.inExpo);
			const x = xAt(f);
			const v = xAt(f + 0.5) - xAt(f - 0.5);
			return (
				<AbsoluteFill>
					<DirBlur x={Math.abs(v) * 0.25} style={{position: 'absolute', inset: 0, transform: `translateX(${x}px)`}}>
						<AbsoluteFill>{children}</AbsoluteFill>
					</DirBlur>
				</AbsoluteFill>
			);
		}
		case 'lift': {
			const p = prog(f, tr.t0, tr.t1 - tr.t0, E.inOutSine);
			return <AbsoluteFill style={{transform: `translateY(${-80 * p}px)`, opacity: 1 - clamp(p)}}>{children}</AbsoluteFill>;
		}
		default:
			return <AbsoluteFill>{children}</AbsoluteFill>;
	}
};

export const isOut = (tr: Transition) => tr.type === 'blinds' || tr.type === 'slide' || tr.type === 'lift';
