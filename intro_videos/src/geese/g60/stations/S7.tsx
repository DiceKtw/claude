// 60 秒〈字的雁陣〉S7・上班開心（小節 16–18，f1929–2314）　錨點 (1400,6000)，下臂（往左錯）
// f1961「上班／開心」兩行 Rise 進場（字重 300，細）→ 長吸一口氣（2 拍）f2057 最重 900、吐到 700
// → f2121 第二口短吸只給「開心」700→900（上班→開心，重心落在開心）→ f2154「是我們的文化」Rise → f2186 Mono 小標擦出
// → 小節 18 大字往右上、小字往左下各漂 ~10px（視差，畫面不死）→ f2298 鏡頭往左下離站（字帶方向模糊）。
// 版面（站內座標 0–790 × 0–978）：四行一路往左下錯 60px（上班 250 → 開心 190 → 附屬句 130 → 小標 70），跟短筆畫同方向。
// 大字分兩行 230px（每行約佔畫寬 43%）：一行 4 字 180px 會寬 720px，樓梯往左錯就塞不進站框。
// 鏡頭停留會往左下漂 42/60px＋慢推 1.2%：右緣 ≤ 743、上緣 ≥ 66 才保證整段都在閱讀窗內。
import React from 'react';
import {drift} from '../../../lib/components';
import {C60} from '../../copy';
import {F, G, bar60} from '../../theme';
import {MonoTag, Rise, StationBox, StationProps, breath} from '../kit';
import {ST} from '../timeline';
import {CamBlur, wt} from './S7_parts';
import {Away} from './Away';

const T = {
	enter: bar60(16, 2), // f1961 上班開心（字重 300）
	peak1: bar60(17, 1), // f2057 第一口氣最重
	peak2: bar60(17, 3), // f2121 第二口氣最重
	sub: bar60(17, 4), // f2154 是我們的文化
	tag: bar60(18, 1), // f2186 雁｜生活係髮廊
	leave: ST.S8.from - 16, // f2298 鏡頭離站
} as const;

const LAYER: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 0, height: 0};
const BIG = 230;
const ROWS = [C60.S7.big.slice(0, 2), C60.S7.big.slice(2)];
const X = {r0: 250, r1: 190, sub: 130, tag: 70} as const;
const Y = {r0: 170, r1: 402, sub: 660, tag: 762} as const;

/** ②字重呼吸（連兩拍算 1 個關鍵字）：第一口長吸氣（2 拍）整個詞 300→900，吐到 700；第二口短吸只給「開心」700→900 */
const weightAt = (f: number, row: number) => {
	if (f < (T.peak1 + T.peak2) / 2 || row === 0) return breath(f, T.peak1, 64, 14, 300, 900, 700);
	return breath(f, T.peak2, 12, 22, 700, 900, 820);
};

export const S7: React.FC<StationProps> = ({f}) => {
	if (f < T.enter - 6) return null;
	// 小節 18 停留：大字往右上、小字往左下各漂 10px（視差）
	const d = drift(f, T.tag, T.leave + 8, 1);
	return (
		<StationBox id="S7">
			{/* 整合：鏡頭到 S8 後收字（右上角不留半截附屬句／小標），拉遠揭曉跟紋理轉墨一起回來（見 Away.tsx） */}
			<Away f={f} next="S8">
				{/* 大字：兩行樓梯（「開心」比「上班」往左錯 60px） */}
				<CamBlur f={f} box={{x: 170, y: 150, w: 580, h: 500}}>
					<div style={{...LAYER, transform: `translate(${(d * 7).toFixed(2)}px, ${(-d * 10).toFixed(2)}px)`}}>
						{ROWS.map((r, i) => (
							<Rise key={i} f={f} at={T.enter - 3 + i * 3} dy={44} dur={16} style={{position: 'absolute', left: i ? X.r1 : X.r0, top: i ? Y.r1 : Y.r0}}>
								<div style={{fontFamily: F.round, fontWeight: wt(weightAt(f, i)), fontSize: BIG, lineHeight: 1, color: G.ink, whiteSpace: 'pre'}}>{r}</div>
							</Rise>
						))}
					</div>
				</CamBlur>
				{/* 附屬句＋Mono 小標：繼續往左下錯 */}
				<CamBlur f={f} box={{x: 50, y: 650, w: 460, h: 175}}>
					<div style={{...LAYER, transform: `translate(${(-d * 7).toFixed(2)}px, ${(d * 10).toFixed(2)}px)`}}>
						<Rise f={f} at={T.sub - 3} dy={26} style={{position: 'absolute', left: X.sub, top: Y.sub}}>
							<div style={{fontFamily: F.round, fontWeight: 500, fontSize: 60, lineHeight: 1.2, color: G.ink, whiteSpace: 'pre'}}>{C60.S7.sub}</div>
						</Rise>
						<MonoTag f={f} at={T.tag - 2} text={C60.S7.tag} size={36} style={{position: 'absolute', left: X.tag, top: Y.tag, lineHeight: 1.2}} />
					</div>
				</CamBlur>
			</Away>
		</StationBox>
	);
};
