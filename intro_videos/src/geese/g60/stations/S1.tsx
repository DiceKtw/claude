// 60 秒〈字的雁陣〉S1・先報價（小節 1–2，f0–257）　錨點 (0,0)，上臂
// f32 「先報價」落陣（全片第 1 次 VDrop）→ f64 副句 Rise → f96 流程小標往右下排出，
// 「服務」搶跑撞上細墨線、等「確認 →」寫完線被抽掉，才在小節 2 正拍（f129）衝進位置。
import React from 'react';
import {F, G, b60, bar60} from '../../theme';
import {C60} from '../../copy';
import {Rise, StationBox, StationProps, VDrop} from '../kit';
import {ST} from '../timeline';
import {CamBlur, FlowStair, backOut, reachT} from './S1_parts';

// VDrop 的 land 是「過衝收定」那格；字第一次衝到位（≥97%）在 land 前 0.57×dur 格。
// 要讓「報」衝到位那格＝第 2 拍（f32），land 就往後放。
const HIT = b60(1);
const DUR = 18;
const LAND = HIT + Math.round(DUR * (1 - reachT(backOut(1.2)))); // backOut(1.2)＝kit 裡 VDrop 的 8% 過衝曲線

// VDrop 的 from：分鏡寫 {dx:-520, dy:360}（偏水平），但「報」領頭時右翼「價」會沿著幾乎同一條斜線
// 從「報」身上穿過去（落地前 3 格兩字疊在一起）。改成更陡的左下方（一樣從左下飛進），
// 三個字各走各的直線不互穿，空中排成真正的 ^ 字雁陣：「報」在尖端，「先」「價」兩翼在後。
const FROM = {dx: -300, dy: 1540};

export const S1: React.FC<StationProps> = ({f}) => {
	// 鏡頭模糊只在這站自己的離站移鏡用（拉遠揭曉時不開，跟其他站一致）
	const on = f >= LAND - DUR - 2 && f <= ST.S2.from + 24;
	return (
		<StationBox id="S1">
			{/* 主字：V 字從左下飛進，「報」領頭 */}
			<CamBlur f={f} box={{x: 40, y: 228, w: 640, h: 252}} active={on}>
				<div style={{position: 'absolute', left: 50, top: 240}}>
					<VDrop f={f} text={C60.S1.big} land={LAND} size={204} from={FROM} dur={DUR} />
				</div>
			</CamBlur>
			{/* 副句：往右錯 50px */}
			<CamBlur f={f} box={{x: 92, y: 496, w: 698, h: 80}} active={on}>
				<Rise f={f} at={b60(2) - 3} style={{position: 'absolute', left: 100, top: 502}}>
					<div style={{fontFamily: F.round, fontWeight: 500, fontSize: 52, lineHeight: 1.3, color: G.ink, whiteSpace: 'pre'}}>{C60.S1.sub}</div>
				</Rise>
			</CamBlur>
			{/* 流程：報價 → 確認 → 服務（一階往右下 60px） */}
			<CamBlur f={f} box={{x: 150, y: 632, w: 440, h: 196}} active={on}>
				<FlowStair
					f={f}
					words={C60.S1.flow}
					x={160}
					y={642}
					size={40}
					stepY={62}
					t={{
						row0: b60(3) - 3, // f93：擦出，拍上 3/4
						row1: b60(3) + 1, // f97：「確認」慢慢寫
						row1End: b60(3) + 22, // f118：「確認 →」寫完
						gateIn: b60(3) + 3, // f99：細墨線垂下
						rush: b60(3) + 5, // f101：「服務」搶跑
						hit: b60(3) + 12, // f108：撞線
						gateOut: b60(3) + 23, // f119：線被抽掉（6 格 inExpo）
						land: bar60(2), // f129：「服務」衝進位置＝小節 2 正拍
					}}
				/>
			</CamBlur>
		</StationBox>
	);
};
