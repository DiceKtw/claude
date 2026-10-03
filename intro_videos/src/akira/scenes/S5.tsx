// Akira S5 結尾金句卡 1416–1800（全域格數；全幅墨黑，這段 HUD 由總裝淡出）
// 置中排版，逐行淡入＋上移 20px（inOutSine 24 格）：金句兩行 → 米白短槓 → Akira → 川沙龍 → 歡迎預約＋細線。
// 金句的兩條排字基準線先描出來（設計師排版的輔助線），字站穩後收掉，留下乾淨的卡。
// 1770–1800 全部錯開淡出，最後一格只剩墨黑底（＋跟 S0 第一格相同的暗角），循環時接回開頭。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, lerp, prog} from '../../lib/motion';
import {Glint, Push, Svg, Vignette} from '../../lib/components';
import {FadeRise} from './S3_parts';

const C = AKIRA;

// 時間（全域格數）
// 整合：原本 1436 起筆，1438–1448 幾乎全黑；提前 12 格，溶接時就看得到基準線在展開
const GUIDE0 = [1424, 1430]; // 兩條排字基準線由中心往兩側描出
const GUIDE_OUT = 1532; // 基準線收掉（短槓出場前）
// 分鏡寫的是事件格（配樂和弦落點）。inOutSine 24 格最快的是中點，
// 所以每行提前 12 格起跑：事件那格剛好半透明、移動最快（最用力的那一格落在和弦上）
const LEAD = 12;
const T_L1 = 1460 - LEAD;
const T_L2 = 1500 - LEAD;
const T_BAR = 1560 - 3; // 短槓 outCubic：提前 3 格，1560 那格已經長到三分之一、還在快速展開
const T_NAME = 1580 - LEAD;
const T_SALON = 1610 - LEAD;
const T_BOOK = 1650 - LEAD;
const T_UNDER = 1652; // 歡迎預約下方細線由左往右
const T_GLINT = 1688; // 細線上慢慢掃一次光
const PUSH0 = 1440;
const PUSH1 = 1770;
const FADE0 = 1770; // 由上往下每 2 格錯開淡出，1798 全部歸零
const ENTER = {dur: 24, rise: 20, ease: E.inOutSine};

// 版面（文字盒上緣）
const Y_L1 = 618;
const Y_L2 = 738;
const Y_BAR = 898;
const Y_NAME = 940;
const Y_SALON = 1100;
const Y_BOOK = 1170;
const Y_UNDER = 1236;
const UNDER_HALF = 120;
const GUIDE_HALF = 404;
// 基準線：字身框底再往下 12px（盒上緣 + 半行距 + 1em + 12），跟字腳留一道縫，不貼字
const GUIDE_Y = [Y_L1 + 84 * 0.1 + 84 + 12, Y_L2 + 84 * 0.1 + 84 + 12];

const row: React.CSSProperties = {left: 0, width: 1080, display: 'flex', justifyContent: 'center'};

export const S5: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// 每個元素的淡出係數（由上往下錯開）
	const out = (k: number) => 1 - prog(g, FADE0 + k * 2, 18, E.inOutSine);

	const guideOut = 1 - prog(g, GUIDE_OUT, 26, E.inOutSine);
	const barP = prog(g, T_BAR, 22, E.outCubic);
	const underP = prog(g, T_UNDER, 34, E.inOutSine);

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.02} originX={540} originY={900}>
				<Svg>
					{/* 排字基準線（暖灰 1.5px、很淡），兩端小刻度 */}
					{GUIDE_Y.map((y, i) => {
						const p = prog(g, GUIDE0[i], 30, E.inOutSine);
						const op = 0.24 * guideOut;
						if (p <= 0 || op <= 0.002) return null;
						const half = GUIDE_HALF * p;
						return (
							<g key={i} opacity={op}>
								<line x1={540 - half} y1={y} x2={540 + half} y2={y} stroke={C.muted} strokeWidth={C.hairline} />
								{p >= 0.98 ? (
									<>
										<line x1={540 - GUIDE_HALF} y1={y - 7} x2={540 - GUIDE_HALF} y2={y + 7} stroke={C.muted} strokeWidth={C.hairline} />
										<line x1={540 + GUIDE_HALF} y1={y - 7} x2={540 + GUIDE_HALF} y2={y + 7} stroke={C.muted} strokeWidth={C.hairline} />
									</>
								) : null}
							</g>
						);
					})}

					{/* 米白短槓 48×4：由中心往兩側 */}
					{barP > 0 ? <rect x={540 - 24 * barP} y={Y_BAR} width={48 * barP} height={4} fill={C.accent} opacity={out(2)} /> : null}

					{/* 歡迎預約下方細線：由左往右描出，再慢慢掃一次光 */}
					{underP > 0 ? (
						<line
							x1={540 - UNDER_HALF}
							y1={Y_UNDER}
							x2={lerp(540 - UNDER_HALF, 540 + UNDER_HALF, underP)}
							y2={Y_UNDER}
							stroke={C.muted}
							strokeWidth={C.hairline}
							opacity={out(5)}
						/>
					) : null}
					<g opacity={out(5)}>
						<Glint x0={540 - UNDER_HALF} x1={540 + UNDER_HALF} y={Y_UNDER} f={g} start={T_GLINT} dur={60} color={C.accent} width={C.hairline} />
					</g>
				</Svg>

				{/* 金句 */}
				<FadeRise f={g} start={T_L1} {...ENTER} fadeOut={out(0)} style={{...row, top: Y_L1}}>
					<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 84, lineHeight: 1.2, color: C.paper, whiteSpace: 'pre'}}>剪的不是頭髮，</div>
				</FadeRise>
				<FadeRise f={g} start={T_L2} {...ENTER} fadeOut={out(1)} style={{...row, top: Y_L2}}>
					<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 84, lineHeight: 1.2, color: C.paper, whiteSpace: 'pre'}}>
						是你<span style={{color: C.accent}}>想成為的樣子</span>。
					</div>
				</FadeRise>

				{/* 署名 */}
				<FadeRise f={g} start={T_NAME} {...ENTER} fadeOut={out(3)} style={{...row, top: Y_NAME}}>
					<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 120, lineHeight: 1.2, color: C.paper, whiteSpace: 'pre'}}>Akira</div>
				</FadeRise>
				<FadeRise f={g} start={T_SALON} {...ENTER} fadeOut={out(4)} style={{...row, top: Y_SALON}}>
					<div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 40, lineHeight: '56px', color: C.muted, letterSpacing: '0.3em', paddingLeft: '0.3em', whiteSpace: 'pre'}}>
						川沙龍
					</div>
				</FadeRise>
				<FadeRise f={g} start={T_BOOK} {...ENTER} fadeOut={out(5)} style={{...row, top: Y_BOOK}}>
					<div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 36, lineHeight: '50px', color: C.accent, letterSpacing: '0.3em', paddingLeft: '0.3em', whiteSpace: 'pre'}}>
						歡迎預約
					</div>
				</FadeRise>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};
