// 安格斯 S1 小元件：iris 邊緣的橘色圈、會喀喀轉的小星芒、帶游標的等寬標題
import React from 'react';
import {E, clamp, lerp, prog, pulseAt} from '../../lib/motion';
import {Spark, sparkRays} from '../../lib/components';
import {F, H, W} from '../../lib/theme';
import {TR} from '../timeline';

/**
 * iris 轉場（228–240）時 S1 的底：圓的內部 paper、內緣一圈 accent，看起來像那顆球「撐開」成新畫面。
 * 半徑跟 Master 的 iris 用同一個公式算，所以邊緣剛好貼齊。
 * paper 和 accent 畫在同一個 SVG 裡（S1 這段不畫 CSS 底色），clip 邊緣只切到 accent，不會出現淡色毛邊。
 */
export const irisActive = (g: number) => {
	const tr = TR.irisS1;
	return tr.type === 'iris' && g >= tr.t0 && g < tr.t1;
};

export const IrisRim: React.FC<{g: number; color: string; fill: string}> = ({g, color, fill}) => {
	const tr = TR.irisS1;
	if (tr.type !== 'iris' || !irisActive(g)) return null;
	const p = prog(g, tr.t0, tr.t1 - tr.t0, E.inOutQuart);
	const far = Math.hypot(Math.max(tr.cx, W - tr.cx), Math.max(tr.cy, H - tr.cy));
	const r = far * p;
	if (r < 0.5) return null;
	// 還跟球差不多大時整顆是橘色（就是那顆球），之後越撐越大邊越細
	const w = r < 34 ? r : lerp(26, 5, clamp(p * 1.6));
	const out = 3; // 往外多畫，讓 clip 的反鋸齒吃到橘色
	const inner = r - w;
	return (
		<g>
			{inner > 0.5 ? <circle cx={tr.cx} cy={tr.cy} r={inner + 1} fill={fill} /> : null}
			<circle cx={tr.cx} cy={tr.cy} r={Math.max(0.01, (inner + r + out) / 2)} fill="none" stroke={color} strokeWidth={w + out} />
		</g>
	);
};

/** 小星芒：bloom 綻放後，每拍脈動＋喀一聲轉 30° */
export const ClickSpark: React.FC<{
	g: number;
	cx: number;
	cy: number;
	size: number;
	bloom: number;
	beats: number[];
	color: string;
}> = ({g, cx, cy, size, bloom, beats, color}) => {
	if (g < bloom - 3) return null;
	// 光芒提前 3 格、每道錯開半格噴出：落拍那格已經有一半以上的光在外面
	const rays = sparkRays(g, bloom - 3, 0.5, 14);
	// 綻放時帶一點旋轉甩進來
	const spin = -50 * (1 - prog(g, bloom - 3, 22, E.outExpo));
	let click = 0;
	for (const b of beats) click += prog(g, b - 2, 6, E.outExpo);
	const pulse = pulseAt(g, beats.map((b) => b - 2), 10, 0.22);
	const core = 7 * prog(g, bloom - 3, 8, E.outBack);
	return <Spark cx={cx} cy={cy} size={size * pulse} rays={rays} color={color} rotate={spin + click * 30} core={core} rayWidth={0.11} />;
};

/** 等寬標題：由左往右擦出，擦的前緣帶一個 accent 小游標 */
export const MonoTitle: React.FC<{
	g: number;
	x: number;
	y: number; // 上緣
	start: number;
	dur: number;
	text: string;
	size: number;
	color: string;
	cursor: string;
}> = ({g, x, y, start, dur, text, size, color, cursor}) => {
	const p = prog(g, start, dur, E.outExpo);
	if (p <= 0) return null;
	const wEst = Array.from(text).reduce((w, ch) => w + (/[⺀-鿿＀-￯　-〿]/.test(ch) ? size : size * 0.6), 0);
	const curOp = 1 - prog(g, start + dur, 6, E.inOutSine);
	const lh = size * 1.3;
	return (
		<div style={{position: 'absolute', left: x, top: y, height: lh}}>
			<div
				style={{
					fontFamily: F.mono,
					fontSize: size,
					lineHeight: `${lh}px`,
					color,
					whiteSpace: 'pre',
					clipPath: `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`,
				}}
			>
				{text}
			</div>
			{curOp > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: wEst * p + 4,
						top: (lh - size * 1.05) / 2,
						width: size * 0.5,
						height: size * 1.05,
						background: cursor,
						opacity: curOp,
					}}
				/>
			) : null}
		</div>
	);
};
