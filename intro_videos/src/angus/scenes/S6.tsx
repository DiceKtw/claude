// 安格斯 S6 收尾 1440–1800（ink 底）
// 回憶符號沿彎路加速掉進中心（每 4 格吸一個）→ 蓄力 → 1500 星芒綻放 → 往上縮
// → 名字落拍 1560 → 副標字距收攏 → 圓拉成輸入框、打字 → 1690 按下圓鈕 → 1740 最後脈動
// → 星芒收回成橘點、落回地平線中央、壓扁像眨眼 → 1799 全黑（循環接回 S0）
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, beatsFrom, clamp, lerp, mixHex, prog, pulseAt} from '../../lib/motion';
import {ImpactFlicks, MaskRise, Push, Ring, Spark, Svg, Typewriter, Vignette, ghostFrames, sparkRays} from '../../lib/components';
import {
	ABSORB,
	BLINK,
	BLOOM_AT,
	BOX,
	BTN,
	CORE,
	Inhale,
	PRESS_AT,
	RecallSymbol,
	Reticle,
	STAR_TOP,
	SYMBOLS,
	SendButton,
} from './S6_parts';

const C = ANGUS;

const NAME_TOP = 624; // 字面上緣≈640
const SUB_TOP = 866;
const STAR_BEATS = beatsFrom(1560, 7); // 1560…1740：每拍慢轉 30°＋脈動
const LAST_PULSE = 1740;
const LOOP_VIG = 1772; // 收尾暗角淡入（1772–1798），接回 S0 第 0 格

// 收尾的橘點：1776 起往上一跳、重力落到地平線（1790 著地）
const FALL0 = 1776;
const LAND = 1790;
const GC = BLINK.ground - BLINK.r;
const V0 = -6;
const ACC = (2 * (GC - STAR_TOP.y - V0 * (LAND - FALL0))) / Math.pow(LAND - FALL0, 2);
const dotY = (f: number) => {
	if (f < FALL0) return STAR_TOP.y;
	const t = Math.min(f, LAND) - FALL0;
	return STAR_TOP.y + V0 * t + 0.5 * ACC * t * t;
};

export const S6: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	/* ---------- 中心小點（吸收前） ---------- */
	const absorbed = ABSORB.filter((a) => g >= a).length;
	const kick = pulseAt(g, ABSORB, 8, 0.3);
	const squeeze = 1 - 0.28 * prog(g, BLOOM_AT - 7, 6, E.inCubic); // 形變提前 7 格：綻放前縮一下
	const swell = 1 + 0.25 * prog(g, ABSORB[5] + 6, 16, E.inOutSine);
	const dotR = (7 + absorbed * 1.3) * kick * swell * squeeze * prog(g, 1438, 8, E.outBack);

	/* ---------- 星芒 ---------- */
	const mv = prog(g, 1530, 28, E.inOutQuart); // 1530–1558 往上移、縮到 0.45
	const sCy = lerp(CORE.y, STAR_TOP.y, mv);
	const sSc = lerp(1, 0.45, mv);
	// 光芒提前 4 格、每道錯開 0.3 格：落拍那格已經大半張開（最用力的那一格）
	const rays0 = sparkRays(g, BLOOM_AT - 4, 0.3, 16);
	const retract = 1 - prog(g, 1766, 10, E.inCubic); // 收尾：光芒收回
	// 1740 最後一拍：不再噴震波（跟 1500 長得一樣），改成光芒伸長 1.3 倍再收回＋整塊字一起「踢」一下
	const flare = pulseAt(g, [LAST_PULSE - 6], 18, 0.3);
	const rays = rays0.map((r) => r * retract * flare);
	let turn = -45 * (1 - prog(g, BLOOM_AT - 2, 28, E.outExpo));
	for (const b of STAR_BEATS) turn += 30 * prog(g, b - 6, 20, E.inOutSine);
	const beatPulse = pulseAt(g, STAR_BEATS.map((b) => b - 2), 12, 0.12);
	// pulseAt 的峰值在 b+0.315×dur：提前 6 格起跑，最大那一格剛好落在 1500／1740
	const lastPulse = pulseAt(g, [LAST_PULSE - 6], 18, 0.12);
	const bloomPulse = pulseAt(g, [BLOOM_AT - 6], 18, 0.5); // 綻放先衝到約 1.5 倍再回到 320（超過頭→回彈）
	const kickBlock = pulseAt(g, [LAST_PULSE - 6], 18, 0.03);
	const starSize = 320 * sSc * beatPulse * lastPulse * bloomPulse;
	const coreR = lerp(16, 9, mv) + (BLINK.r - 9) * prog(g, 1764, 12, E.outBack);
	const starOn = g >= BLOOM_AT - 4 && g < FALL0;

	/* ---------- 收尾的橘點 ---------- */
	const falling = g >= FALL0;
	const dy = dotY(g);
	const vy = dotY(g) - dotY(g - 1);
	const blinkK = prog(g, LAND, 5, E.inCubic);
	let dsx = 1;
	let dsy = 1;
	if (g < LAND) {
		const st = clamp(Math.abs(vy) / 70) * 0.3;
		dsx = 1 - st * 0.5;
		dsy = 1 + st;
	} else {
		dsx = 1.4 + 0.9 * prog(g, LAND, 5, E.outCubic);
		dsy = 0.6 * (1 - blinkK);
	}

	/* ---------- 文字、輸入框 ---------- */
	const fade = 1 - prog(g, 1770, 20, E.inOutSine);
	const subTrack = lerp(0.6, 0.08, prog(g, 1575, 30, E.outExpo));
	const subOp = prog(g, 1575, 12, E.outCubic);
	const nameDy = -drift8(g);
	const boxDy = 6 * prog(g, 1640, 130, E.inOutSine);
	const circle = prog(g, 1612, 9, E.outBack);
	const stretch = prog(g, 1620, 20, E.outExpo);
	const boxW = lerp(BOX.h, BOX.w, stretch);
	const flash = pulseAt(g, [PRESS_AT], 18, 1) - 1;
	const boxCol = mixHex(C.paper, C.accent, flash);
	const btnPop = prog(g, 1634, 10, E.outBack);

	return (
		<AbsoluteFill style={{background: C.ink}}>
			{/* 匯聚段：準星、符號、中心小點、蓄力環 */}
			<Svg>
				<Reticle g={g} />
				<Inhale g={g} />
				{SYMBOLS.map((_, i) => (
					<RecallSymbol key={i} i={i} g={g} />
				))}
				{g < BLOOM_AT - 3 && dotR > 0.1 ? <circle cx={CORE.x} cy={CORE.y} r={dotR} fill={C.accent} /> : null}

				{/* 1500 綻放＋兩圈震波 */}
				<Ring cx={CORE.x} cy={CORE.y} f={g} start={BLOOM_AT - 1} dur={44} r0={40} r1={860} w0={5} color={C.paper} />
				<Ring cx={CORE.x} cy={CORE.y} f={g} start={BLOOM_AT + 3} dur={48} r0={30} r1={780} w0={2} color={alpha(C.paper, 0.7)} />
				{starOn ? <Spark cx={CORE.x} cy={sCy} size={starSize} rays={rays} color={C.accent} rotate={turn} core={coreR} rayWidth={0.1} /> : null}

			</Svg>

			{/* 名字、副標、輸入框（慢推＋上下視差） */}
			<Push f={g} from={BLOOM_AT} to={1770} amount={0.02} originX={540} originY={820}>
				<AbsoluteFill style={{opacity: fade, transform: `scale(${kickBlock.toFixed(4)})`, transformOrigin: '540px 820px'}}>
					<div style={{position: 'absolute', left: 0, width: 1080, top: NAME_TOP + nameDy, display: 'flex', justifyContent: 'center'}}>
						<MaskRise segments="安格斯" start={1556} f={g} size={190} color={C.paper} weight={900} family={F.display} stagger={3} />
					</div>
					{subOp > 0 ? (
						<div style={{position: 'absolute', left: 0, width: 1080, top: SUB_TOP + nameDy, display: 'flex', justifyContent: 'center'}}>
							<div
								style={{
									fontFamily: F.sans,
									fontWeight: 500,
									fontSize: 40,
									lineHeight: '56px',
									color: alpha(C.paper, 0.7),
									letterSpacing: `${subTrack}em`,
									paddingLeft: `${subTrack}em`,
									whiteSpace: 'pre',
									opacity: subOp,
								}}
							>
								雁沙龍 ／ 美髮人的教練
							</div>
						</div>
					) : null}

					<AbsoluteFill style={{transform: `translateY(${boxDy.toFixed(2)}px)`}}>
						<Svg>
							{circle > 0 ? (
								<rect
									x={BOX.cx - (boxW / 2) * circle}
									y={BOX.cy - (BOX.h / 2) * circle}
									width={boxW * circle}
									height={BOX.h * circle}
									rx={(BOX.h / 2) * circle}
									fill="none"
									stroke={boxCol}
									strokeWidth={2 + flash}
								/>
							) : null}
							<SendButton g={g} pop={btnPop} />
						</Svg>
						<div
							style={{
								position: 'absolute',
								left: BOX.cx - BOX.w / 2 + 48,
								top: BOX.cy - BOX.h / 2,
								height: BOX.h,
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<Typewriter
								text="讓你的技術，值更多錢"
								start={1636}
								f={g}
								every={2}
								size={52}
								color={C.paper}
								hotColor={C.accent}
								hotFrames={4}
								cursorColor={C.accent}
								weight={700}
								family={F.sans}
								style={{lineHeight: '72px'}}
							/>
						</div>
					</AbsoluteFill>
				</AbsoluteFill>
			</Push>

			{/* 收尾：橘點落回地平線中央、壓扁像眨眼（不跟著慢推，位置要跟 S0 第 0 格對齊） */}
			<Svg>
				{falling && g < LAND && Math.abs(vy) > 14
					? ghostFrames(g, 3, 1.2).map((gh, k) => <circle key={k} cx={BLINK.x} cy={dotY(gh.f)} r={BLINK.r * 0.94} fill={C.accent} opacity={gh.o} />)
					: null}
				{falling && dsy > 0.02 ? (
					<ellipse
						cx={BLINK.x}
						cy={g < LAND ? dy : BLINK.ground - BLINK.r * dsy}
						rx={BLINK.r * dsx}
						ry={BLINK.r * dsy}
						fill={C.accent}
					/>
				) : null}
				<ImpactFlicks x={BLINK.x} y={BLINK.ground} f={g} start={LAND - 1} dur={7} color={alpha(C.paper, 0.8)} width={2.5} spread={36} len={26} />
			</Svg>

			{/* 整合修正：S0 第 0 格有 Vignette 0.45，最後一段把同樣的暗角淡入，1799 才跟 f0 一模一樣（循環時四角不會突然變暗） */}
			{g >= LOOP_VIG ? <Vignette strength={0.45 * prog(g, LOOP_VIG, 26, E.inOutSine)} /> : null}
		</AbsoluteFill>
	);
};

/** 名字區塊往上漂 8px（1560 起） */
const drift8 = (g: number) => 8 * prog(g, 1560, 210, E.inOutSine);
