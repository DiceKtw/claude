// 60 秒〈字的雁陣〉S7／S8 用的小元件（只給 S7.tsx、S8.tsx 用）
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {clamp} from '../../../lib/motion';
import {camera} from '../camera';
import {moveBlurXY} from './S1_parts';

export type Box = {x: number; y: number; w: number; h: number};

/** 撐滿父框（DirBlur 開關模糊時字才不會跳位） */
export const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'};

/**
 * 站與站之間 1 拍移鏡（每格位移上百 px）時，這一塊字跟著鏡頭方向帶方向模糊；停留慢漂、拉遠揭曉時不模糊。
 * 只在 box（站內座標）範圍開 filter，比整個站框小，算圖快；子元素照樣用站內座標排。
 */
export const CamBlur: React.FC<{f: number; box: Box; children: React.ReactNode}> = ({f, box, children}) => {
	const {x: bx, y: by} = moveBlurXY(f, camera(f).zoom);
	return (
		<div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h}}>
			<DirBlur x={bx} y={by} style={FULL}>
				{/* 座標層用 0×0：不把整個站框算進 filter 範圍（範圍只跟著字走，算圖快） */}
				<div style={{position: 'absolute', left: -box.x, top: -box.y, width: 0, height: 0}}>{children}</div>
			</DirBlur>
		</div>
	);
};

/** 字重夾在 100–900 並四捨五入成整數 */
export const wt = (w: number) => Math.round(clamp(w, 100, 900));
