// 30 秒〈一格一位〉共用元件與時間表（唯讀：鏡頭檔只能使用，缺什麼在自己的檔裡做）
// 規則：全部硬切、落在拍上；不移鏡、不疊溶、不閃白。直排黑框借雁價目表的版式（不是圓角膠囊）。
import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, prog} from '../../lib/motion';
import {F, G, bar30, b30} from '../theme';

export type ShotProps = {f: number};

// 鏡頭表（小節 1 起算；128 BPM：1 拍 28.125 格、1 小節 112.5 格）
export const SH = {
	A: {from: bar30(1), to: bar30(2)}, // 開場鉤子：6 個「客」擠一格 → 5 個 V 字彈出 → 剩 1 個、格子填黃
	B: {from: bar30(2), to: bar30(3)}, // 不會同一個時段，塞好幾位讓你等
	C: {from: bar30(3), to: bar30(4)}, // 名牌（logo 第一次出現）
	D: {from: bar30(4), to: bar30(5)}, // 老實話
	E: {from: bar30(5), to: bar30(7)}, // 燙・染（每拍硬切）
	F: {from: bar30(7), to: bar30(9)}, // 從頭到尾
	G: {from: bar30(9), to: bar30(11)}, // 評論（旋律進來）
	H: {from: bar30(11), to: bar30(13)}, // 晚上（第 12 小節末鼓抽 2 拍）
	I: {from: bar30(13), to: bar30(15)}, // 回到那一格：「客」換成「你」
	J: {from: bar30(15), to: 1800}, // 片尾
} as const;
export type ShotId = keyof typeof SH;
export const SHOTS = Object.keys(SH) as ShotId[];
export const beatOf = (f: number) => (f * 64) / 1800; // 第幾拍（小數）
export {b30, bar30};

/** 紙底＋3% 紙紋雜訊（固定 seed，不閃） */
export const Paper: React.FC<{seed?: number; color?: string}> = ({seed = 3, color = G.paper}) => {
	const id = 'p' + useId().replace(/[^a-zA-Z0-9]/g, '');
	return (
		<AbsoluteFill style={{background: color}}>
			<svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.03}}>
				<filter id={id}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${id})`} />
			</svg>
		</AbsoluteFill>
	);
};

/** 拉門：從畫面外滑進（inOutExpo 8 格），回傳位移 px */
export const slideIn = (f: number, at: number, from: 'top' | 'bottom' | 'left' | 'right', dist: number) => {
	const p = prog(f, at, 8, E.inOutExpo);
	const d = (1 - p) * dist;
	if (from === 'top') return {x: 0, y: -d};
	if (from === 'bottom') return {x: 0, y: d};
	if (from === 'left') return {x: -d, y: 0};
	return {x: d, y: 0};
};

/** 直排黑框（10px 墨框的高長方格，字直排在格子裡） */
export const VBox: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	text?: string;
	size?: number;
	color?: string;
	fill?: string;
	border?: number;
	weight?: number;
	family?: string;
	offset?: {x: number; y: number};
	children?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x, y, w, h, text, size = 96, color = G.ink, fill = 'transparent', border = 10, weight = 900, family = F.round, offset = {x: 0, y: 0}, children, style}) => (
	<div
		lang="zh-Hant-TW"
		style={{
			position: 'absolute',
			left: x + offset.x,
			top: y + offset.y,
			width: w,
			height: h,
			boxSizing: 'border-box',
			border: `${border}px solid ${G.ink}`,
			background: fill,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			...style,
		}}
	>
		{text ? (
			<div style={{writingMode: 'vertical-rl', textOrientation: 'upright', fontFamily: family, fontWeight: weight, fontSize: size, color, lineHeight: 1.05, letterSpacing: '0.04em', whiteSpace: 'pre'}}>
				{text}
			</div>
		) : null}
		{children}
	</div>
);

/** 那一格：墨框方格，黃色由下往上填滿（fillAt 是填滿完成的格數＝重拍；4 格內填完） */
export const Cell: React.FC<{
	f: number;
	x: number;
	y: number;
	size: number;
	fillAt?: number;
	fillColor?: string;
	border?: number;
	children?: React.ReactNode;
	offset?: {x: number; y: number};
}> = ({f, x, y, size, fillAt, fillColor = G.yellow, border = 10, children, offset = {x: 0, y: 0}}) => {
	const p = fillAt === undefined ? 0 : clamp((f - (fillAt - 4)) / 4);
	return (
		<div style={{position: 'absolute', left: x + offset.x, top: y + offset.y, width: size, height: size, boxSizing: 'border-box', border: `${border}px solid ${G.ink}`, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(E.outCubic(p) * 100).toFixed(2)}%`, background: fillColor}} />
			<div style={{position: 'absolute', inset: 0}}>{children}</div>
		</div>
	);
};

/** 水平一行字（附屬句） */
export const Line: React.FC<{x: number; y: number; text: string; size?: number; weight?: number; color?: string; f: number; at: number; style?: React.CSSProperties}> = ({x, y, text, size = 52, weight = 500, color = G.ink, f, at, style}) => {
	const p = prog(f, at, 10, E.outExpo);
	return (
		<div lang="zh-Hant-TW" style={{position: 'absolute', left: x, top: y + (1 - p) * 30, opacity: f >= at ? 1 : 0, fontFamily: F.round, fontWeight: weight, fontSize: size, color, whiteSpace: 'pre', ...style}}>
			{text}
		</div>
	);
};

/** 雁 logo（重描檔）：放在 public/geese/logo_ink.png 才會出現；沒有檔案時回傳 null */
export {logoSrc} from '../g60/kit';
