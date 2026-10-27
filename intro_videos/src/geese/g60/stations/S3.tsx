// 60 秒〈字的雁陣〉S3・每個月（小節 5–7，f514–900）　錨點 (1400,2000)，上臂
// 版面（站內座標 0–790 × 0–978）：一行一行往下排、每行往右錯 56px（樓梯）。
// 鏡頭停留時會沿筆畫往右下漂 42/60px＋慢推 1.2%，所以字不貼站框左上角（x ≥ 48、y ≥ 90），
// 停留最後一格也還在閱讀窗 x 90–880、y 270–1248 裡。
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, clamp, prog} from '../../../lib/motion';
import {C60} from '../../copy';
import {F, G, bar60, b60} from '../../theme';
import {MonoTag, Rise, StairDrop, StationBox, StationProps, tracking} from '../kit';
import {Away} from './Away';
import {MoveBlur} from './S5_parts';

// 版面（站內 y）：上半是「每月課程」一組，空一段，下半是「活動」一組
const Y = {big: 96, sub: 322, tag: 426, ev: 620, evSub: 836} as const;

// 拍點
const T = {
	enter: bar60(5, 2), // f546「每個月」進場
	step1: bar60(5, 3), // f579 字距第 1 推
	sub: bar60(5, 4), // f611 附屬句＋字距第 2 推
	step3: bar60(6, 1), // f643 字距最後一推（小節 6 正拍，最大一步）
	tag: bar60(6, 2), // f675 Mono 小標「年度教育課程：」
	// 第 1 輪修正：後半段整組往前收半小節，最後一行「像是…」才有 1.8 秒可讀（原本只有 0.75 秒）
	tagA: b60(21.5), // f691「剪髮・」（半拍）
	tagB: bar60(6, 3), // f707「燙髮・」
	tagC: b60(22.5), // f723「染髮」（半拍）
	ev: bar60(6, 4), // f739「不定期辦活動」樓梯落字
	evSub: bar60(7, 1), // f771「像是剪髮講座、陶藝課」（小節 7 正拍）
} as const;

const STEP_X = 56; // 樓梯：每往下一行往右錯
const BIG = 190; // 「每個月」字級：展開到 0.4em 後寬 3.8×190 ≈ 722px，左起 48 → 右緣 770（站框 790 內）
const X0 = 48;

/** 字距展開（③，全片只用這一次）：跟著拍子分三推，越推越大，最後一推落在小節 6 正拍。
 *  每一推提前 9 格起跑、12 格走完，拍點那格已經到位（inOutQuart 約 97%）。 */
const spread = (f: number) =>
	tracking(f, T.step1 - 9, 12, 0.1) + tracking(f, T.sub - 9, 12, 0.12) + tracking(f, T.step3 - 9, 12, 0.18);

/** 「每個月」：Rise 的變形——一字一字往上浮進來（錯 3 格），不透明度 4 格就到位（拍點那格已是實心墨字），
 *  位移 outExpo 16 格、快的那幾格帶一點垂直模糊；之後隨拍子把字距推開。 */
const MonthWord: React.FC<{f: number}> = ({f}) => {
	const em = spread(f);
	const chars = Array.from(C60.S3.big);
	return (
		<div style={{position: 'absolute', left: X0, top: Y.big, display: 'flex', whiteSpace: 'pre'}}>
			{chars.map((ch, i) => {
				const s0 = T.enter - 4 + i * 3;
				const y = (ff: number) => (1 - prog(ff, s0, 16, E.outExpo)) * 64;
				const vy = y(f + 0.5) - y(f - 0.5);
				return (
					<DirBlur key={i} y={Math.abs(vy) * 0.18}>
						<span
							style={{
								display: 'block',
								transform: `translateY(${y(f).toFixed(2)}px)`,
								opacity: clamp((f - s0 + 1) / 4),
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: BIG,
								lineHeight: 1,
								color: G.ink,
								marginRight: i < chars.length - 1 ? em * BIG : 0,
							}}
						>
							{ch}
						</span>
					</DirBlur>
				);
			})}
		</div>
	);
};

/** Mono 小標：整行斜 3°（順著筆畫往右下），拆成「年度教育課程：／剪髮・／燙髮・／染髮」四段跟拍擦出 */
const TAG_SEGS = C60.S3.tag.match(/[^：・]+[：・]?/g) ?? [C60.S3.tag];
const TAG_AT = [T.tag, T.tagA, T.tagB, T.tagC];

const CourseTag: React.FC<{f: number}> = ({f}) => (
	<div
		style={{
			position: 'absolute',
			left: X0 + STEP_X * 2,
			top: Y.tag,
			display: 'flex',
			opacity: 0.85,
			transform: 'rotate(3deg)',
			transformOrigin: '0 50%',
		}}
	>
		{/* 38px、85%、字距 0.04em：這行是真的課程內容，要讀得到（中文不需要 Mono 的 0.12em 字距） */}
		{TAG_SEGS.map((s, i) => (
			<MonoTag key={i} f={f} at={TAG_AT[i] - 2} text={s} size={38} color={G.ink} style={{lineHeight: 1.2, letterSpacing: '0.04em'}} />
		))}
	</div>
);

export const S3: React.FC<StationProps> = ({f}) => {
	if (f < T.enter - 8) return null;
	return (
		<StationBox id="S3">
			{/* 整合：離站時帶方向模糊（跟其他站一致），鏡頭到 S4 後收字、拉遠揭曉再回來（見 Away.tsx） */}
			<Away f={f} next="S4">
				<MoveBlur f={f}>
					<MonthWord f={f} />

					{/* 都安排課程，精進技術 */}
					<Rise f={f} at={T.sub - 3} dy={28} style={{position: 'absolute', left: X0 + STEP_X, top: Y.sub}}>
						<div style={{fontFamily: F.round, fontWeight: 500, fontSize: 56, lineHeight: 1.2, color: G.ink, whiteSpace: 'pre'}}>{C60.S3.sub}</div>
					</Rise>

					<CourseTag f={f} />

					{/* 不定期辦活動：⑤樓梯落字（全片 2 次之一），往右下、一字一階 18px */}
					<StairDrop
						f={f}
						text={C60.S3.ev}
						start={T.ev - 3}
						size={72}
						dir={1}
						step={18}
						stagger={3}
						dur={12}
						style={{position: 'absolute', left: X0 + STEP_X * 3, top: Y.ev}}
					/>

					{/* 像是剪髮講座、陶藝課 */}
					<Rise f={f} at={T.evSub - 3} dy={24} style={{position: 'absolute', left: X0 + STEP_X * 4, top: Y.evSub}}>
						<div style={{fontFamily: F.round, fontWeight: 500, fontSize: 48, lineHeight: 1.2, color: G.ink, whiteSpace: 'pre'}}>{C60.S3.evSub}</div>
					</Rise>
				</MoveBlur>
			</Away>
		</StationBox>
	);
};
