// 60 秒〈字的雁陣〉總裝（唯讀；這個檔不 import 任何站點，開發 entry 只 import 自己那組）
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {G, READ} from '../theme';
import {ensureGeeseFonts} from '../fonts';
import {ALL_TEXT} from '../copy';
import {camera, nearCamera} from './camera';
import {ANCHOR} from './world';
import {ST, STATIONS} from './timeline';
import {StationProps} from './kit';

ensureGeeseFonts(ALL_TEXT);

export type Parts60 = Partial<Record<'Texture' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'Overlay', React.FC<StationProps>>>;

export const G60: React.FC<{parts: Parts60}> = ({parts}) => {
	const f = useCurrentFrame();
	const cam = camera(f);
	const revealing = f >= ST.REVEAL.from - 20;
	const T = parts.Texture;
	const O = parts.Overlay;
	return (
		<AbsoluteFill style={{background: G.yellow}}>
			{/* 世界圖層：整張字地圖跟著鏡頭走 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transformOrigin: '0 0',
					transform: `translate(${(READ.cx - cam.x * cam.zoom).toFixed(2)}px, ${(READ.cy - cam.y * cam.zoom).toFixed(2)}px) scale(${cam.zoom.toFixed(5)})`,
				}}
			>
				{T ? <T f={f} cam={cam} /> : null}
				{STATIONS.map((id) => {
					const C = parts[id];
					if (!C) return null;
					if (!revealing && !nearCamera(ANCHOR[id], cam)) return null;
					return <C key={id} f={f} cam={cam} />;
				})}
			</div>
			{/* 畫面圖層：拉遠揭曉、logo、片尾資訊 */}
			{O ? <O f={f} cam={cam} /> : null}
		</AbsoluteFill>
	);
};
