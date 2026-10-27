// 30 秒〈一格一位〉鏡頭 F–J 共用小元件（只給 F／G／H／I／J 用）
import React, {useId} from 'react';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {VBox} from '../kit';
import {VText} from './A_parts';

/** 中央差分速度（每格位移） */
export const vel = (fn: (ff: number) => number, f: number) => fn(f + 0.5) - fn(f - 0.5);

/**
 * 方向模糊（效能版）：濾鏡範圍只朝模糊方向外擴 3σ。
 * 模糊量很小時直接不掛濾鏡。w／h 是被模糊那一塊的大小（算濾鏡範圍用）。
 */
export const Blur: React.FC<{x?: number; y?: number; w: number; h: number; style: React.CSSProperties; children: React.ReactNode}> = ({
	x = 0,
	y = 0,
	w,
	h,
	style,
	children,
}) => {
	const id = 'fb' + useId().replace(/[^a-zA-Z0-9]/g, '');
	const bx = Math.min(36, Math.abs(x));
	const by = Math.min(36, Math.abs(y));
	if (bx < 0.25 && by < 0.25) return <div style={style}>{children}</div>;
	const px = (bx * 3 + 2) / Math.max(1, w);
	const py = (by * 3 + 2) / Math.max(1, h);
	return (
		<>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={id} x={-px} y={-py} width={1 + 2 * px} height={1 + 2 * py} filterUnits="objectBoundingBox">
					<feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
				</filter>
			</svg>
			<div style={{...style, filter: `url(#${id})`}}>{children}</div>
		</>
	);
};

/** 直排一欄（左上角定位）。多欄用 \n 分開，第一欄在最右邊（vertical-rl） */
export const VCol: React.FC<{
	text: string;
	x: number;
	y: number;
	size: number;
	weight?: number;
	color?: string;
	family?: string;
	style?: React.CSSProperties;
}> = ({text, x, y, size, weight = 900, color = G.ink, family = F.round, style}) => (
	<div
		lang="zh-Hant-TW"
		style={{
			position: 'absolute',
			left: x,
			top: y,
			writingMode: 'vertical-rl',
			textOrientation: 'upright',
			fontFamily: family,
			fontWeight: weight,
			fontSize: size,
			color,
			lineHeight: 1.05,
			letterSpacing: '0.04em',
			whiteSpace: 'pre',
			...style,
		}}
	>
		{text}
	</div>
);

/** 直排一欄的高度（字數 × (1 + 字距 0.04em)） */
export const vColH = (text: string, size: number) => Array.from(text).length * size * 1.04;

/** 「設計師」小直排墨框（跟 E 的常駐標籤同一個樣式：100×280、8px 框、56px），可移動；lag＝框裡的字的慣性位移 */
export const TAG = {w: 100, h: 280} as const;
export const TagBox: React.FC<{x: number; y: number; lag?: number}> = ({x, y, lag = 0}) => (
	<VBox x={x} y={y} w={TAG.w} h={TAG.h} fill={G.paper} border={8} style={{overflow: 'hidden'}}>
		<VText text={C30.E.tag} size={56} dy={lag} />
	</VBox>
);
