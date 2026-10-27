// 30 秒〈一格一位〉鏡頭 E 的小元件：超大裁切字、常駐「設計師」小框、價目表式的列
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {alpha} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {VBox} from '../kit';

/** 超大裁切字：以字的中心定位（畫面座標），可裁在某個矩形裡。
 *  快速移動不用高斯模糊（1300px 的字整塊模糊一格要多花近 1 秒），改用物理的擠壓／伸展：
 *  sx、sy 是兩軸縮放，origin 是受力點（撞地就以底部為準）。 */
export const Giant: React.FC<{
	ch: string;
	cx: number;
	cy: number;
	size: number;
	color?: string;
	sx?: number;
	sy?: number;
	origin?: string;
	clip?: {x: number; y: number; w: number; h: number};
}> = ({ch, cx, cy, size, color = G.ink, sx = 1, sy = 1, origin = '50% 50%', clip}) => {
	const glyph = (
		<div
			lang="zh-Hant-TW"
			style={{
				position: 'absolute',
				left: cx - size / 2,
				top: cy - size / 2,
				width: size,
				height: size,
				lineHeight: `${size}px`,
				textAlign: 'center',
				fontFamily: F.round,
				fontWeight: 900,
				fontSize: size,
				color,
				whiteSpace: 'pre',
				transform: sx !== 1 || sy !== 1 ? `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})` : undefined,
				transformOrigin: origin,
			}}
		>
			{ch}
		</div>
	);
	if (!clip) return glyph;
	return (
		<div style={{position: 'absolute', left: clip.x, top: clip.y, width: clip.w, height: clip.h, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: -clip.x, top: -clip.y, width: 1080, height: 1920}}>{glyph}</div>
		</div>
	);
};

/** 常駐標籤：「設計師」小直排墨框（價目表式直角黑框，紙色底，壓在所有東西上面，位置永遠不動） */
export const TAG = {x: 770, y: 950, w: 100, h: 280} as const;
export const DesignerTag: React.FC = () => (
	<VBox x={TAG.x} y={TAG.y} w={TAG.w} h={TAG.h} text={C30.E.tag} size={56} fill={G.paper} border={8} />
);

/** 一列字（價目表的列）：水平、900、墨色可調淡 */
export const Row: React.FC<{x: number; y: number; a: number; blurY?: number}> = ({x, y, a, blurY = 0}) => {
	const el = (
		<div
			lang="zh-Hant-TW"
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				fontFamily: F.round,
				fontWeight: 900,
				fontSize: 60,
				lineHeight: '76px',
				color: alpha(G.ink, a),
				whiteSpace: 'pre',
			}}
		>
			{C30.E.line}
		</div>
	);
	const box: React.CSSProperties = {position: 'absolute', left: x, top: y, width: 700, height: 76};
	if (blurY < 0.2) return <div style={box}>{el}</div>;
	return (
		<DirBlur y={blurY} style={box}>
			{el}
		</DirBlur>
	);
};
