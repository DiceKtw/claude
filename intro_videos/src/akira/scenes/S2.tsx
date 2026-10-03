// Akira S2 美感 576–960（全域格數）
// 筆在紙上描一張側臉＋鮑伯短髮（臉→髮型外輪廓→瀏海三筆主線，再補頸後、閉眼、兩道髮流四筆短線），髮型區塊淡淡上色，
// 之後每拍一個量測標註（髮際／下巴輔助線 → 1 : 1.618 → 15° → 輪廓線）。
// 文案（主角）提前到 810／840 落拍：完整停留約 1.5 秒才被 936 的細線掃掉（原本 870／900 只停 0.4 秒讀不完）；
// 同拍的 15°、輪廓線標註晚 4 格起跑，當文案的跟班。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, clamp, lerp, prog} from '../../lib/motion';
import {DrawPath, MaskRise, Push, Svg, Vignette, drift} from '../../lib/components';
import {MonoTag, cubsD, sampler} from './S0_parts';
import {BANG, CHIN, EYE, FACE, HAIR, HAIR_END, HAIR_FILL_D, JAW_DEG, LV, NAPE, STRAND_A, STRAND_B} from './S2_parts';

const C = AKIRA;

// 時間（全域格數）
// 576–600 S1 往上漂走（Master 讓 S1 疊在本場景上面）：本場景墨黑底一開始就不透明，漂走時底色不會變暗
// 主線三筆帶筆尖點（pen: true）；短線四筆只描、不帶筆尖
const STROKES = [
	{cubs: FACE, t0: 600, t1: 642, pen: true},
	{cubs: HAIR, t0: 636, t1: 698, pen: true},
	{cubs: BANG, t0: 692, t1: 712, pen: true},
	{cubs: NAPE, t0: 700, t1: 712, pen: false},
	{cubs: EYE, t0: 708, t1: 718, pen: false},
	{cubs: STRAND_A, t0: 712, t1: 726, pen: false},
	{cubs: STRAND_B, t0: 716, t1: 730, pen: false},
];
const PEN_IN = 584; // 第一筆的筆尖在起點淡入（600 落筆）
const FILL0 = 724;
const FILL1 = 750;
const FILL_OP = 0.08;
const B_GUIDE = 750; // HAIRLINE／JAWLINE
const B_RATIO = 780; // 1 : 1.618
const B_ANGLE = 810; // 15°
const B_LEAD = 840; // 輪廓線
const FOLLOW = 4; // 15°、輪廓線跟在文案後面 4 格
const L1 = 803; // 「他看的不只是頭髮，」（810 拍站穩大半；quiet 是線性淡入，提前 7 格）
const L2 = 833; // 「是整體比例」（840 拍，Gmaj9）
// 慢推從第一筆落筆就開始（600→960 不停）：標註之間不會整段不動，文字一出現就在非 1 的縮放裡（避免 LCD 次像素彩邊）
const PUSH0 = 600;
const PUSH1 = 960;
const DRIFT0 = 750; // 標註小字從第一個標註起整組慢慢往左漂

// 版面
const TX = 110;
const TY1 = 396;
const TY2 = 488;
const GUIDE_X0 = 120;
const GUIDE_X1 = 930;
const BRACKET_X = 300;
const DY = 18; // 線稿＋標註整組往下挪，跟文案拉開呼吸

const STROKE_D = STROKES.map((s) => cubsD(s.cubs));
const STROKE_SAMP = STROKES.map((s) => sampler(s.cubs));

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
	const x0 = cx + Math.cos(a0) * r;
	const y0 = cy + Math.sin(a0) * r;
	const x1 = cx + Math.cos(a1) * r;
	const y1 = cy + Math.sin(a1) * r;
	const sweep = a1 > a0 ? 1 : 0;
	return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 ${sweep} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

export const S2: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// 線稿
	const sp = STROKES.map((s) => prog(g, s.t0, s.t1 - s.t0, E.inOutSine));
	const fillP = prog(g, FILL0, FILL1 - FILL0, E.inOutSine);

	// 標註整組往左漂
	const tagDx = drift(g, DRIFT0, PUSH1, -8);

	// 標註進度（每拍一個，提前 4 格起跑）
	// 拍點那格要看得到變化：outCubic（一出手最快）、提前 3 格起跑
	const gP = (k: number) => prog(g, B_GUIDE - 3 + k * 3, 26, E.outCubic);
	const ratioP = prog(g, B_RATIO - 3, 26, E.outCubic);
	const angP = prog(g, B_ANGLE - 3 + FOLLOW, 22, E.outCubic);
	const leadP = prog(g, B_LEAD - 3 + FOLLOW, 24, E.outCubic);

	const guideLine = (y: number, p: number) =>
		p > 0 ? (
			<line x1={GUIDE_X0} y1={y} x2={lerp(GUIDE_X0, GUIDE_X1, p)} y2={y} stroke={C.muted} strokeWidth={C.hairline} strokeDasharray="6 7" opacity={clamp(p * 3)} />
		) : null;

	// 下顎角度：以 JAWLINE 虛線當水平基準，在下巴右邊的空白處畫下顎線的延長線＋小弧（不跟 4px 下顎線疊成雙線）
	const angR = 64;
	const ANG_ARM = 96;
	const angA0 = 0; // 水平往右（＝JAWLINE）
	const angA1 = (-JAW_DEG * Math.PI) / 180; // 延長線往右上 15°
	// 輪廓線引線
	const leadKnee: [number, number] = [262, 1092]; // 斜線轉水平的轉折點
	const leadEnd: [number, number] = [210, 1092];

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{background: C.ink}} />
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.02} originX={600} originY={820}>
				<Svg style={{transform: `translateY(${DY}px)`}}>
					{/* 髮型區塊填色（米白 8%） */}
					{fillP > 0 ? <path d={HAIR_FILL_D} fill={C.accent} opacity={FILL_OP * fillP} /> : null}

					{/* 線稿＋筆尖（主線三筆才有筆尖） */}
					{STROKE_D.map((d, i) => (
						<DrawPath key={i} d={d} p={sp[i]} color={C.accent} width={C.line} />
					))}
					{sp.map((p, i) => {
						// 整合：S1 漂走到第一筆落筆之間（594–600）原本全黑；第一筆的筆尖提前在起點淡入，等 600 落筆
						const pre = i === 0 ? prog(g, PEN_IN, STROKES[0].t0 - PEN_IN, E.outCubic) : 0;
						if (!STROKES[i].pen || p >= 1 || (p <= 0 && pre <= 0)) return null;
						const tip = STROKE_SAMP[i].at(p);
						const op = (i === 0 ? pre : clamp((g - STROKES[i].t0) / 3)) * clamp((STROKES[i].t1 - g) / 4);
						return <circle key={i} cx={tip.x} cy={tip.y} r={4} fill={C.accent} opacity={op} />;
					})}
				</Svg>

				{/* 量測線（黏在線稿上，跟線稿一起） */}
				<AbsoluteFill style={{transform: `translateY(${DY}px)`}}>
					<Svg>
						{/* 750：髮際／下巴輔助線 */}
						{guideLine(LV.hairline, gP(0))}
						{guideLine(LV.jaw, gP(1))}

						{/* 780：1 : 1.618 比例括號 */}
						{ratioP > 0 ? (
							<g opacity={clamp(ratioP * 2)}>
								<line x1={BRACKET_X} y1={LV.crown} x2={BRACKET_X} y2={lerp(LV.crown, LV.hairEnd, ratioP)} stroke={C.muted} strokeWidth={C.hairline} />
								{[LV.crown, LV.split, LV.hairEnd].map((y, i) => {
									const on = clamp((ratioP - i * 0.42) * 5);
									return <line key={i} x1={BRACKET_X - 8} y1={y} x2={BRACKET_X - 8 + 26 * on} y2={y} stroke={C.muted} strokeWidth={C.hairline} opacity={on} />;
								})}
							</g>
						) : null}

						{/* 810：下顎角度（JAWLINE 當水平臂，只畫往右上的虛線延長臂＋小弧線） */}
						{angP > 0 ? (
							<g>
								<line
									x1={CHIN[0]}
									y1={CHIN[1]}
									x2={CHIN[0] + Math.cos(angA1) * lerp(0, ANG_ARM, angP)}
									y2={CHIN[1] + Math.sin(angA1) * lerp(0, ANG_ARM, angP)}
									stroke={C.muted}
									strokeWidth={C.hairline}
									strokeDasharray="4 5"
								/>
								<DrawPath d={arcD(CHIN[0], CHIN[1], angR, angA0, angA1)} p={prog(g, B_ANGLE + 2 + FOLLOW, 14, E.outCubic)} color={C.muted} width={C.hairline} cap="butt" />
								<circle cx={CHIN[0]} cy={CHIN[1]} r={3} fill={C.muted} opacity={angP} />
							</g>
						) : null}

						{/* 840：髮尾 → 左側引線 */}
						{leadP > 0 ? (
							<g>
								<circle cx={HAIR_END[0]} cy={HAIR_END[1]} r={8} fill="none" stroke={C.muted} strokeWidth={C.hairline} opacity={clamp(leadP * 3)} />
								<polyline
									points={(() => {
										const a: [number, number] = [HAIR_END[0] - 6, HAIR_END[1] + 6];
										const l1 = Math.hypot(leadKnee[0] - a[0], leadKnee[1] - a[1]);
										const l2 = leadKnee[0] - leadEnd[0];
										const s = leadP * (l1 + l2);
										const pts: [number, number][] = [a];
										if (s <= l1) pts.push([lerp(a[0], leadKnee[0], s / l1), lerp(a[1], leadKnee[1], s / l1)]);
										else pts.push(leadKnee, [leadKnee[0] - (s - l1), leadKnee[1]]);
										return pts.map((q) => q.join(',')).join(' ');
									})()}
									fill="none"
									stroke={C.muted}
									strokeWidth={C.hairline}
									strokeDasharray="6 7"
								/>
								{leadP >= 1 ? <circle cx={leadEnd[0]} cy={leadEnd[1]} r={3} fill={C.muted} /> : null}
							</g>
						) : null}
					</Svg>
				</AbsoluteFill>

				{/* 標註小字（整組在 900 後往左漂 6px） */}
				<AbsoluteFill style={{transform: `translate(${tagDx}px, ${DY}px)`}}>
					<MonoTag f={g} start={B_GUIDE - 3} x={GUIDE_X0} y={LV.hairline - 34} text="HAIRLINE" size={22} />
					<MonoTag f={g} start={B_GUIDE} x={GUIDE_X0} y={LV.jaw - 34} text="JAWLINE" size={22} />
					<MonoTag f={g} start={B_RATIO - 1} x={BRACKET_X - 20} y={LV.split + 30} text="1 : 1.618" tracking={0.12} align="right" size={22} />
					<MonoTag f={g} start={B_ANGLE - 1 + FOLLOW} x={CHIN[0] + 104} y={CHIN[1] - 40} text="15°" tracking={0.12} size={22} />
					{leadP > 0 ? (
						<div
							style={{
								position: 'absolute',
								left: TX,
								top: leadEnd[1] - 19,
								fontFamily: F.sans,
								fontWeight: 500,
								fontSize: 26,
								lineHeight: '36px',
								color: C.accent,
								letterSpacing: '0.12em',
								opacity: prog(g, B_LEAD - 1 + FOLLOW, 20, E.outCubic),
								transform: `translateY(${(1 - prog(g, B_LEAD - 1 + FOLLOW, 20, E.outCubic)) * 16}px)`,
							}}
						>
							輪廓線
						</div>
					) : null}
				</AbsoluteFill>

				{/* 文案 */}
				<div style={{position: 'absolute', left: TX, top: TY1}}>
					<MaskRise segments="他看的不只是頭髮，" start={L1} f={g} size={72} color={C.paper} weight={500} family={F.sans} quiet stagger={3} dur={16} lineHeight={1.18} />
				</div>
				<div style={{position: 'absolute', left: TX, top: TY2}}>
					<MaskRise
						segments={[{text: '是'}, {text: '整體比例', color: C.accent, weight: 700}]}
						start={L2}
						f={g}
						size={72}
						color={C.paper}
						weight={500}
						family={F.sans}
						quiet
						stagger={3}
						dur={16}
						lineHeight={1.18}
					/>
				</div>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};

