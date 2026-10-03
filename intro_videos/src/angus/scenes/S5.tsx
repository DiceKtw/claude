// 安格斯 S5 蒙太奇 1320–1440（8 刀 × 15 格，硬切）
// 每刀：底色輪替、240px 大字、1→1.04 慢推（第一格就在動）、一個只用一次的小技法、等寬編號
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog} from '../../lib/motion';
import {DirBlur, ImpactFlicks, MaskRise, Svg} from '../../lib/components';
import {MONTAGE_BG} from '../timeline';
import {
	CUT,
	CUT0,
	Calendar,
	CutTag,
	Halftone,
	KernGuides,
	LoopArrow,
	PriceTag,
	SLAM,
	TeamDots,
	WORD,
	WORDS,
	WordRings,
	brandTracking,
	shakeAt,
	slamScale,
} from './S5_parts';

const C = ANGUS;
const LH = 1.18;
const WORD_TOP = WORD.cy - (WORD.size * LH) / 2;

const bgOf = (k: (typeof MONTAGE_BG)[number]) => (k === 'ink' ? C.ink : k === 'accent' ? C.accent : C.paper);
const fgOf = (k: (typeof MONTAGE_BG)[number]) => (k === 'ink' ? C.paper : C.ink);

/** 置中的大字盒 */
const Center: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{position: 'absolute', left: 0, width: 1080, top: WORD_TOP, height: WORD.size * LH, display: 'flex', justifyContent: 'center', ...style}}>
		{children}
	</div>
);

const bigStyle = (fg: string): React.CSSProperties => ({
	fontFamily: F.display,
	fontWeight: 900,
	fontSize: WORD.size,
	lineHeight: `${WORD.size * LH}px`,
	color: fg,
	whiteSpace: 'pre',
});

export const S5: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);
	const i = clamp(Math.floor((g - CUT0) / CUT), 0, 7);
	const s = CUT0 + i * CUT;
	const key = MONTAGE_BG[i];
	const bg = bgOf(key);
	const fg = fgOf(key);
	const word = WORDS[i];

	// 每刀 1→1.04 慢推：從刀前 2 格起算，第一格就已經在動
	const push = 1 + 0.04 * prog(g, s - 2, 22, E.outCubic);
	const [shx, shy] = i === 7 ? shakeAt(g) : [0, 0];

	/* ---------- 大字 ---------- */
	let big: React.ReactNode;
	if (i === 4) {
		// 品牌：字距從很開收攏（收攏時帶水平模糊）
		const tr = brandTracking(g, s);
		const v = Math.abs(brandTracking(g + 0.5, s) - brandTracking(g - 0.5, s)) * WORD.size;
		big = (
			<Center>
				<DirBlur x={v * 0.12}>
					<div style={{...bigStyle(fg), letterSpacing: `${tr}em`, paddingLeft: `${tr}em`}}>{word}</div>
				</DirBlur>
			</Center>
		);
	} else if (i === 7) {
		// 收入：從 1.4 倍砸下，著地那格壓扁、回彈
		const sc = slamScale(g);
		// 只看「剛剛那半格」的速度：著地那格（接觸格）要清楚
		const vs = g < SLAM.land ? Math.abs(slamScale(g) - slamScale(g - 1)) : 0;
		const squash = g >= SLAM.land ? 1 - prog(g, SLAM.land, 7, E.outBack) : 0;
		const sx = sc * (1 + 0.07 * squash);
		const sy = sc * (1 - 0.1 * squash);
		const ghosts = g < SLAM.land ? [1, 2] : [];
		big = (
			<>
				{ghosts.map((k) => (
					<Center key={k} style={{transform: `scale(${lerp(sc, SLAM.from + 0.1, k * 0.35)})`, transformOrigin: `540px ${WORD.size * LH * 0.75}px`, opacity: 0.22 / k}}>
						<div style={bigStyle(fg)}>{word}</div>
					</Center>
				))}
				<Center style={{transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`, transformOrigin: `540px ${WORD.size * LH * 0.75}px`}}>
					<DirBlur y={vs * 40}>
						<div style={bigStyle(fg)}>{word}</div>
					</DirBlur>
				</Center>
			</>
		);
	} else {
		big = (
			<Center>
				<MaskRise segments={word} start={s - 5} f={g} size={WORD.size} color={fg} weight={900} family={F.display} stagger={2} dur={10} lineHeight={LH} />
			</Center>
		);
	}

	/* ---------- 小技法 ---------- */
	const halfW = (WORD.size * 2 + brandTracking(g, s) * WORD.size) / 2;
	const tech =
		i === 0 ? <Halftone g={g} s={s} fg={fg} /> :
		i === 1 ? <PriceTag g={g} s={s} fg={fg} /> :
		i === 2 ? <LoopArrow g={g} s={s} fg={fg} /> :
		i === 3 ? <TeamDots g={g} s={s} fg={fg} /> :
		i === 4 ? <KernGuides g={g} s={s} fg={fg} halfW={halfW} /> :
		i === 5 ? <WordRings g={g} s={s} fg={fg} /> :
		i === 6 ? <Calendar g={g} s={s} fg={fg} /> :
		null;
	// 網點在字後面，其他在字前後都可以（線都不壓到字）
	const techBehind = i === 0 || i === 5;

	return (
		<AbsoluteFill style={{background: bg}}>
			<AbsoluteFill
				style={{
					transform: `translate(${shx}px, ${shy}px) scale(${push.toFixed(4)})`,
					transformOrigin: `${WORD.cx}px ${WORD.cy}px`,
				}}
			>
				{techBehind ? <Svg>{tech}</Svg> : null}
				{big}
				{!techBehind && tech ? <Svg>{tech}</Svg> : null}
				{i === 7 ? (
					<Svg>
						<ImpactFlicks x={WORD.cx} y={WORD.cy + 118} f={g} start={SLAM.land - 1} dur={12} color={fg} width={4} spread={300} len={60} />
					</Svg>
				) : null}
				<CutTag g={g} s={s} i={i} fg={fg} />
			</AbsoluteFill>
			{/* 刀與刀之間的細節：左右邊的小刻度跟著刀數前進（不是文字） */}
			<Svg>
				{Array.from({length: 8}, (_, k) => {
					const on = k <= i;
					const y = 1170;
					const x = WORD.cx + (k - 3.5) * 22;
					const pop = k === i ? prog(g, s - 1, 6, E.outBack) : 1;
					return (
						<rect
							key={k}
							x={x - 4 * pop}
							y={y - 4 * pop}
							width={8 * pop}
							height={8 * pop}
							fill={on ? (key === 'accent' ? C.ink : C.accent) : 'none'}
							stroke={alpha(fg, on ? 0 : 0.35)}
							strokeWidth={1.5}
						/>
					);
				})}
			</Svg>
		</AbsoluteFill>
	);
};
