// 60 秒〈字的雁陣〉S2・燙・染，全程設計師操作（小節 3–4，f257–514）　錨點 (700,1000)
// f289 「燙・染」從右側反向進場（右邊的字領頭，擠成一疊滑進來再往左彈開）
// f321 「全程設計師操作」Rise → 「設計師」字重呼吸，最重那格＝小節 4 正拍（f386）
import React from 'react';
import {F, G, bar60} from '../../theme';
import {C60} from '../../copy';
import {Rise, StationBox, StationProps, breath} from '../kit';
import {ST} from '../timeline';
import {CamBlur, FanIn} from './S1_parts';

const HIT = bar60(3, 2); // f289
const SUB = bar60(3, 3); // f321
const PEAK = bar60(4, 1); // f386

export const S2: React.FC<StationProps> = ({f}) => {
	const sub = C60.S2.sub;
	const key = C60.S2.key;
	const i = sub.indexOf(key);
	const pre = sub.slice(0, i);
	const post = sub.slice(i + key.length);
	const w = breath(f, PEAK, 20, 14, 300, 900, 700);
	// 鏡頭模糊只在這站自己的離站移鏡用（拉遠揭曉時不開，跟其他站一致）
	const leave = f <= ST.S3.from + 24;
	const base: React.CSSProperties = {fontFamily: F.round, fontSize: 60, lineHeight: 1.3, color: G.ink, whiteSpace: 'pre'};
	return (
		<StationBox id="S2">
			<CamBlur f={f} box={{x: 44, y: 316, w: 640, h: 276}} active={f >= HIT - 12 && leave}>
				<FanIn f={f} text={C60.S2.big} hit={HIT} x={60} y={326} size={228} enter={1000} squeeze={40} narrow={{'・': 0.6}} />
			</CamBlur>
			<CamBlur f={f} box={{x: 104, y: 598, w: 460, h: 92}} active={f >= SUB - 4 && leave}>
				<Rise f={f} at={SUB - 3} style={{position: 'absolute', left: 112, top: 604}}>
					<div style={base}>
						<span style={{fontWeight: 500}}>{pre}</span>
						<span style={{fontWeight: w}}>{key}</span>
						<span style={{fontWeight: 500}}>{post}</span>
					</div>
				</Rise>
			</CamBlur>
		</StationBox>
	);
};
