// Akira S5 結尾金句卡 1416–1800（全域格數；全幅墨黑，這段 HUD 由總裝淡出）
// 置中排版，逐行淡入＋上移 20px（inOutSine 24 格）：金句兩行 → 筆的落款（S0 那縷髮絲的縮小版）→ Akira → 川沙龍 → 歡迎預約＋細線。
// 金句的兩條排字基準線先描出來（設計師排版的輔助線），字站穩後收掉，留下乾淨的卡。
// 10/3 審片：
// - 金句是主角：署名 Akira 從 120px 縮成 64px 的落款（金句裡已經有一次 Akira，不再用更大的字重複一次）
// - 米白短槓換成 S0 開場那縷髮絲的縮小版，一樣由筆描出來：頭尾呼應，筆在片尾簽名
// - 整張卡上移（內容中心約 y 825，原本偏低 120px、最後的細線貼著 IG 介面），「歡迎預約」放大、提前出場
// 1770–1800 全部錯開淡出，最後一格只剩墨黑底（＋跟 S0 第一格相同的暗角），循環時接回開頭。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, lerp, prog} from '../../lib/motion';
import {DrawPath, Glint, Push, Svg, Vignette} from '../../lib/components';
import {FadeRise} from './S3_parts';
import {Cub, cubsD, sampler, strandCubs} from './S0_parts';

const C = AKIRA;

// 時間（全域格數）
const GUIDE0 = [1418, 1424]; // 兩條排字基準線由中心往兩側描出（溶接中段就看得到）
const GUIDE_OUT = 1532; // 基準線收掉（落款起筆時）
// 分鏡寫的是事件格（配樂和弦落點）。inOutSine 24 格：提前 16 格起跑，事件那格已升到 3/4、還在走
const LEAD = 16;
const T_L1 = 1460 - LEAD;
const T_L2 = 1500 - LEAD;
const SIGN0 = 1532; // 落款：筆描出縮小的髮絲線（S0 的母題），1572 收筆
const SIGN_DUR = 40;
const T_NAME = 1580 - LEAD; // 署名落在最後一個和弦 D6/9
const T_SALON = 1600 - LEAD;
const T_BOOK = 1620 - LEAD; // 歡迎預約：1620 已站穩大半，完整停留約 2.4 秒
const T_UNDER = 1626; // 歡迎預約下方細線由左往右
const T_GLINT = 1664; // 細線上慢慢掃一次光
const PUSH0 = 1440;
const PUSH1 = 1800; // 一路推到最後一格（淡出時還在推，不會先減速到 0）
const FADE0 = 1770; // 由上往下每 2 格錯開淡出，1798 全部歸零
const ENTER = {dur: 24, rise: 20, ease: E.inOutSine};

// 版面（文字盒上緣）
const Y_L1 = 510;
const Y_L2 = 630;
const SIGN_CY = 818; // 落款中心
const SIGN_S = 0.19; // 縮放（原尺寸約 920×480 → 175×91）
const Y_NAME = 884;
const Y_SALON = 980;
const Y_BOOK = 1050;
const Y_UNDER = 1128;
const UNDER_HALF = 132;
const GUIDE_HALF = 404;
// 基準線：字身框底再往下 12px（盒上緣 + 半行距 + 1em + 12），跟字腳留一道縫，不貼字
const GUIDE_Y = [Y_L1 + 84 * 0.1 + 84 + 12, Y_L2 + 84 * 0.1 + 84 + 12];

// 落款路徑：S0 髮絲線（中心約 (440, 911)）縮小搬到卡的中軸
const SIGN_CUBS: Cub[] = strandCubs(0).map((c) => c.map(([x, y]) => [(x - 440) * SIGN_S + 540, (y - 911) * SIGN_S + SIGN_CY]) as Cub);
const SIGN_D = cubsD(SIGN_CUBS);
const SIGN_SAMP = sampler(SIGN_CUBS);

const row: React.CSSProperties = {left: 0, width: 1080, display: 'flex', justifyContent: 'center'};
// 句尾是全形標點（，。），字框右半是空的：往右補 0.35em，讓字面視覺置中在 540 中軸
const quote: React.CSSProperties = {fontFamily: F.sans, fontWeight: 500, fontSize: 84, lineHeight: 1.2, color: C.paper, whiteSpace: 'pre', marginRight: '-0.35em'};

export const S5: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// 每個元素的淡出係數（由上往下錯開）
	const out = (k: number) => 1 - prog(g, FADE0 + k * 2, 18, E.inOutSine);

	const guideOut = 1 - prog(g, GUIDE_OUT, 26, E.inOutSine);
	const signP = prog(g, SIGN0, SIGN_DUR, E.inOutSine);
	const tip = SIGN_SAMP.at(signP);
	const tipOp = prog(g, SIGN0 - 6, 6, E.outCubic) * out(2);
	const underP = prog(g, T_UNDER, 34, E.inOutSine);

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.024} originX={540} originY={820}>
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

					{/* 落款：筆描出縮小的髮絲線（米白 4px），筆尖 Ø8 跟著線頭、收筆後停在線尾 */}
					<DrawPath d={SIGN_D} p={signP} color={C.accent} width={C.line} opacity={out(2)} />
					{tipOp > 0 ? <circle cx={tip.x} cy={tip.y} r={4} fill={C.accent} opacity={tipOp} /> : null}

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

				{/* 金句（底字 Medium 500，關鍵詞 Akira 用米白 accent + Bold） */}
				<FadeRise f={g} start={T_L1} {...ENTER} fadeOut={out(0)} style={{...row, top: Y_L1}}>
					<div style={quote}>想換髮型，</div>
				</FadeRise>
				<FadeRise f={g} start={T_L2} {...ENTER} fadeOut={out(1)} style={{...row, top: Y_L2}}>
					<div style={quote}>
						先讓 <span style={{color: C.accent, fontWeight: 700}}>Akira</span> 看看。
					</div>
				</FadeRise>

				{/* 署名（落款大小，不跟金句搶） */}
				<FadeRise f={g} start={T_NAME} {...ENTER} fadeOut={out(3)} style={{...row, top: Y_NAME}}>
					<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 64, lineHeight: 1.2, color: C.paper, letterSpacing: '0.04em', paddingLeft: '0.04em', whiteSpace: 'pre'}}>
						Akira
					</div>
				</FadeRise>
				<FadeRise f={g} start={T_SALON} {...ENTER} fadeOut={out(4)} style={{...row, top: Y_SALON}}>
					<div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 44, lineHeight: '60px', color: C.muted, letterSpacing: '0.3em', paddingLeft: '0.3em', whiteSpace: 'pre'}}>
						川沙龍
					</div>
				</FadeRise>
				<FadeRise f={g} start={T_BOOK} {...ENTER} fadeOut={out(5)} style={{...row, top: Y_BOOK}}>
					<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 48, lineHeight: '64px', color: C.accent, letterSpacing: '0.22em', paddingLeft: '0.22em', whiteSpace: 'pre'}}>
						歡迎預約
					</div>
				</FadeRise>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};
