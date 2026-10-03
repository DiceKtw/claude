// 安格斯 S3 經營 824–1080（accent 底，文字 ink）
// 經營秘訣 → 三張卡落下（背面）→ 每拍翻一張（900／930／960）→ 細線＋掃光 → 定格呼吸
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F, STAGE} from '../../lib/theme';
import {E, alpha, lerp, prog, pulseAt} from '../../lib/motion';
import {Abs, Glint, ImpactFlicks, MaskRise, Push, Svg, drift} from '../../lib/components';
import {T, TR} from '../timeline';
import {CARD, CARD_XS, DropGhosts, FLIP_AT, FlipCard} from './S3_parts';

const C = ANGUS;

const LINE_Y = 1050;
const LINE_AT = 990;
const GUIDE_XS = [110, 380, 405, 675, 700, 970];
const GUIDE_YS = [CARD.y, CARD.y + CARD.h];
const SUB_Y = 578;
const lineHead = (f: number) => lerp(110, 970, prog(f, LINE_AT - 1, 24, E.outExpo));
/** 線頭經過 x 的那一格（刻度在那一格彈出） */
const passFrame = (x: number) => {
	for (let f = LINE_AT - 1; f < LINE_AT + 40; f++) if (lineHead(f) >= x - 0.5) return f - 1;
	return LINE_AT + 40;
};

// 整合修正：Master 的 z-index 讓 S4 疊在 S3 上面，所以 S3 往左甩出（1064–1080）改由 S4 在上層重畫（host）。
// Master 排的這一份在甩出期間整個被 S4 蓋住，不用再算。
const SL = TR.slideS3;
const OUT_FROM = SL.type === 'slide' ? SL.t0 : T.S3.to;

export const S3: React.FC<SceneProps & {host?: boolean}> = ({from, host}) => {
	const g = useG(from);
	if (!host && g >= OUT_FROM) return null;

	// 版面參考線（從螢幕放大進來時就開始長）
	const guideV = (j: number) => prog(g, 826 + j * 2, 26, E.outExpo);
	const guideH = (j: number) => prog(g, 834 + j * 3, 26, E.outExpo);
	const crossK = (j: number) => prog(g, 846 + j, 10, E.outBack);

	// 標題區塊慢慢往右漂（跟卡片的呼吸做視差，定格時也不死）
	const hdx = drift(g, 870, 1080, 8);

	// 副標擦出
	const subP = prog(g, 862, 16, E.outExpo);

	// 卡片下方細線
	const lineP = prog(g, LINE_AT - 1, 24, E.outExpo);
	const lineX = lineHead(g);

	return (
		<AbsoluteFill style={{background: C.accent}}>
			<Push f={g} from={1000} to={1064} amount={0.015} originX={540} originY={830}>
				<Svg>
					{/* 版面參考線：卡片欄位、上下緣 */}
					{GUIDE_XS.map((x, j) => (
						<line
							key={`v${j}`}
							x1={x}
							y1={STAGE.top}
							x2={x}
							y2={lerp(STAGE.top, STAGE.bottom, guideV(j))}
							stroke={alpha(C.ink, 0.1)}
							strokeWidth={1}
						/>
					))}
					{GUIDE_YS.map((y, j) => (
						<line key={`h${j}`} x1={80} y1={y} x2={lerp(80, 1000, guideH(j))} y2={y} stroke={alpha(C.ink, 0.1)} strokeWidth={1} />
					))}
					{GUIDE_XS.flatMap((x, j) =>
						GUIDE_YS.map((y, k) => {
							const s = crossK(j + k * 2);
							if (s <= 0) return null;
							return (
								<g key={`c${j}${k}`} transform={`translate(${x} ${y}) scale(${s})`}>
									<line x1={-7} y1={0} x2={7} y2={0} stroke={alpha(C.ink, 0.35)} strokeWidth={1.5} />
									<line x1={0} y1={-7} x2={0} y2={7} stroke={alpha(C.ink, 0.35)} strokeWidth={1.5} />
								</g>
							);
						}),
					)}
					{/* 卡片落下的殘影 */}
					<DropGhosts f={g} />
				</Svg>

				{/* 標題 */}
				<Abs x={110 + hdx} y={430}>
					<MaskRise segments="經營秘訣" start={846} f={g} size={120} color={C.ink} weight={900} family={F.display} stagger={3} />
				</Abs>

				{/* 副標：THREE QUESTIONS / 三個問題 */}
				<Abs x={110 + hdx} y={SUB_Y} style={{clipPath: `inset(0 ${(1 - subP) * 100}% 0 0)`}}>
					<div style={{fontFamily: F.mono, fontSize: 22, lineHeight: '30px', color: alpha(C.ink, 0.6), letterSpacing: '0.08em', whiteSpace: 'pre'}}>
						THREE QUESTIONS / 三個問題
					</div>
				</Abs>

				{/* 進度小方塊：翻一張亮一格 */}
				<Svg>
					{[0, 1, 2].map((k) => {
						const x = 970 - 14 - (2 - k) * 24;
						const inK = prog(g, 866 + k * 3, 10, E.outBack);
						if (inK <= 0) return null;
						const on = g >= FLIP_AT[k];
						const s = inK * pulseAt(g, [FLIP_AT[k] - 1], 10, 0.5);
						return (
							<g key={k} transform={`translate(${x + 7 + hdx} ${SUB_Y + 15}) scale(${s})`}>
								<rect x={-7} y={-7} width={14} height={14} fill={on ? C.ink : 'none'} stroke={C.ink} strokeWidth={2} />
							</g>
						);
					})}
				</Svg>

				{/* 三張卡 */}
				{[0, 1, 2].map((i) => (
					<FlipCard key={i} i={i} f={g} />
				))}

				<Svg>
					{/* 翻到正面那一格：卡片上緣踢兩側小撇 */}
					{CARD_XS.map((x, i) => (
						<ImpactFlicks key={i} x={x + CARD.w / 2} y={CARD.y - 4} f={g} start={FLIP_AT[i] - 1} dur={12} color={C.ink} width={3} spread={14} len={26} />
					))}

					{/* 990：卡片下方細線，從左畫到右，經過的地方立一根刻度 */}
					{lineP > 0 ? (
						<g>
							<line x1={110} y1={LINE_Y} x2={lineX} y2={LINE_Y} stroke={C.ink} strokeWidth={2} />
							{[110, ...CARD_XS.map((x) => x + CARD.w / 2), 970].map((tx, k) => {
								if (lineX < tx - 0.5) return null;
								const end = k === 0 || k === 4;
								const t = prog(g, passFrame(tx), 8, E.outBack);
								const hh = (end ? 10 : 6) * t;
								return <line key={k} x1={tx} y1={LINE_Y - hh} x2={tx} y2={LINE_Y + (end ? hh : 0)} stroke={C.ink} strokeWidth={2} />;
							})}
						</g>
					) : null}
					<Glint x0={110} x1={970} y={LINE_Y} f={g} start={1012} dur={36} color={C.paper} width={2} />
				</Svg>
			</Push>
		</AbsoluteFill>
	);
};
