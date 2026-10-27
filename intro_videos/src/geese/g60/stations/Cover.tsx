// 60 秒〈字的雁陣〉封面（另外輸出一張 PNG，不進影片）
// 分鏡「封面」：用拉遠後那一格（f2950，字拼成的「>」）＋兩行字「雁沙龍」／「去之前會想知道的 8 件事」。
// 版面：f2950 的「>」上下撐滿整個畫面（y 60–1880），上方沒有空位；兩行字放在「>」的開口裡
// （左側、跟頂點同高，開口正中），字在左、箭頭往右指——「雁沙龍 >」。開口是純雁黃（紋理只在筆刷裡），字最清楚；
// 也剛好落在 IG 個人頁 3:4 裁切（y 240–1680）的中段。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALL_TEXT, C60} from '../../copy';
import {ensureGeeseFonts} from '../../fonts';
import {F, G, READ} from '../../theme';
import {camera} from '../camera';
import {Texture} from './Texture';
import {S1} from './S1';
import {S2} from './S2';
import {S3} from './S3';
import {S4} from './S4';
import {S5} from './S5';
import {S6} from './S6';
import {S7} from './S7';
import {S8} from './S8';

// 封面副標：分鏡「封面」一節指定的字（只在封面，不進影片；copy.ts 裡沒有這一句）
const COVER_SUB = '去之前會想知道的 8 件事';
ensureGeeseFonts([...ALL_TEXT, COVER_SUB]);

const COVER_F = 2950;
const STATIONS = [S1, S2, S3, S4, S5, S6, S7, S8];

// 開口：頂點在畫面 (904, 1127)；y 1000 時上臂內緣約 x 688，y 1253 時下臂內緣約 x 686。
// 字塊左緣對齊閱讀窗左緣、上下置中在頂點高度，右緣離筆刷內緣都留 75px 以上。
const X = READ.left + 6;
const TITLE = 170; // 3 字 → 510px（約畫寬 47%）
const SUB = 46;
const TOP = 1000;

export const Cover: React.FC = () => {
	const f = COVER_F;
	const cam = camera(f);
	const [pre, post] = COVER_SUB.split(' 8 ');
	return (
		<AbsoluteFill lang="zh-Hant-TW" style={{background: G.yellow}}>
			{/* 拉遠後的整張字地圖（世界圖層，跟影片 f2950 同一個鏡頭） */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transformOrigin: '0 0',
					transform: `translate(${(READ.cx - cam.x * cam.zoom).toFixed(2)}px, ${(READ.cy - cam.y * cam.zoom).toFixed(2)}px) scale(${cam.zoom.toFixed(5)})`,
				}}
			>
				<Texture f={f} cam={cam} />
				{STATIONS.map((C, i) => (
					<C key={i} f={f} cam={cam} />
				))}
			</div>
			{/* 封面兩行字：放在「>」的開口裡 */}
			<div style={{position: 'absolute', left: X, top: TOP, color: G.ink, whiteSpace: 'pre'}}>
				<div style={{fontFamily: F.round, fontWeight: 900, fontSize: TITLE, lineHeight: 1}}>{C60.END.name}</div>
				<div style={{marginTop: 30, fontFamily: F.round, fontWeight: 500, fontSize: SUB, lineHeight: 1.2, display: 'flex', alignItems: 'baseline'}}>
					<span>{pre}</span>
					<span style={{fontFamily: F.num, fontWeight: 900, fontSize: SUB * 1.18, margin: `0 ${(SUB * 0.22).toFixed(1)}px`}}>8</span>
					<span>{post}</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
