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

// 第 1 輪修正：IG 個人頁 3:4 九宮格（一格約 129pt 寬）裡副標原本只剩 5.5pt 讀不出來 →
// 副標拆成三行放大到 90px（九宮格裡約 10.7pt），三行全部放在「>」的開口裡：
//   雁沙龍（150px／900）／去之前／會想知道的／8 件事（90px／500，「8」用 Anybody 900、117px）。
// 整張地圖往下移 36px（3:4 裁切 y 240–1680 的上緣不再切到「先報價」），開口跟著往下 36px：
// 開口內緣（移動後）約 y 936→x 604、y 1016→663、y 1336→661、y 1416→600，字塊 x 96–546、y 926–1410，每一處都留 50px 以上。
const WORLD_DY = 36;
const X = READ.left + 6;
const TITLE = 150; // 3 字 → 450px
const SUB = 90;
const TOP = 890 + WORLD_DY;

export const Cover: React.FC = () => {
	const f = COVER_F;
	const cam = camera(f);
	const [pre, post] = COVER_SUB.split(' 8 ');
	const subLines = [pre.slice(0, 3), pre.slice(3)]; // 去之前／會想知道的
	return (
		<AbsoluteFill lang="zh-Hant-TW" style={{background: G.yellow}}>
			{/* 拉遠後的整張字地圖（世界圖層，跟影片 f2950 同一個鏡頭） */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transformOrigin: '0 0',
					transform: `translate(${(READ.cx - cam.x * cam.zoom).toFixed(2)}px, ${(READ.cy + WORLD_DY - cam.y * cam.zoom).toFixed(2)}px) scale(${cam.zoom.toFixed(5)})`,
					// 合成層裡的文字用灰階反鋸齒（不然字邊有偏橘／偏綠的 LCD 色邊，IG 再壓一次會更明顯）
					willChange: 'transform',
				}}
			>
				<Texture f={f} cam={cam} />
				{STATIONS.map((C, i) => (
					<C key={i} f={f} cam={cam} />
				))}
			</div>
			{/* 封面字：放在「>」的開口裡 */}
			<div style={{position: 'absolute', left: X, top: TOP, color: G.ink, whiteSpace: 'pre', willChange: 'transform'}}>
				<div style={{fontFamily: F.round, fontWeight: 900, fontSize: TITLE, lineHeight: 1}}>{C60.END.name}</div>
				<div style={{marginTop: 24, fontFamily: F.round, fontWeight: 500, fontSize: SUB, lineHeight: 1.15}}>
					{subLines.map((t, i) => (
						<div key={i}>{t}</div>
					))}
					<div style={{display: 'flex', alignItems: 'baseline'}}>
						<span style={{fontFamily: F.num, fontWeight: 900, fontSize: SUB * 1.3, lineHeight: 1, marginRight: (SUB * 0.22).toFixed(1) + 'px'}}>8</span>
						<span>{post}</span>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
