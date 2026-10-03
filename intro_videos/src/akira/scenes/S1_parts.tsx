// Akira S1 小元件：資訊卡外殼（墨黑卡 90%、1px 暖灰 30% 邊、圓角 18、左上米白短槓＋暖灰小標）
import React from 'react';
import {AKIRA, F} from '../../lib/theme';
import {E, alpha, prog} from '../../lib/motion';

const C = AKIRA;

export const NoteCard: React.FC<{
	f: number;
	x: number;
	y: number;
	w: number;
	h: number;
	label: string;
	barAt: number; // 短槓畫出來的格數
	labelAt: number; // 小標淡入的格數
}> = ({f, x, y, w, h, label, barAt, labelAt}) => {
	const bar = prog(f, barAt, 18, E.inOutSine);
	const lab = prog(f, labelAt, 18, E.outCubic);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 18,
				background: alpha(C.card, 0.9),
				border: `1px solid ${alpha(C.muted, 0.3)}`,
				boxSizing: 'border-box',
			}}
		>
			<div style={{position: 'absolute', left: 36, top: 36, width: 40 * bar, height: 4, background: C.accent}} />
			<div
				style={{
					position: 'absolute',
					left: 94,
					top: 24,
					fontFamily: F.mono,
					fontSize: 20,
					lineHeight: '28px',
					color: C.muted,
					letterSpacing: '0.3em',
					opacity: lab,
					transform: `translateX(${(1 - lab) * -10}px)`,
				}}
			>
				{label}
			</div>
		</div>
	);
};
