// 安格斯 S3 小元件：三張卡（落下、3D 翻面、呼吸）、版面參考線
import React from 'react';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog, pulseAt} from '../../lib/motion';
import {DirBlur} from '../../lib/components';

const C = ANGUS;

export const CARD = {y: 640, w: 270, h: 380, r: 22} as const;
export const CARD_XS = [110, 405, 700] as const;
export const DROP_AT = [872, 876, 880] as const; // 從上方落下（outBack，錯開 4 格）
export const FLIP_AT = [900, 930, 960] as const; // 翻到正面那一格（啪）
export const CARDS = [
	{n: '01', big: '客源', small: '客人從哪來'},
	{n: '02', big: '回客', small: '怎麼回來'},
	{n: '03', big: '客單', small: '怎麼多花'},
] as const;

const DROP_H = 120;
const DROP_DUR = 16;

/** 落下的位移（負值＝還在上面）；outBack 會先衝過頭一點再回來 */
export const dropY = (f: number, i: number) => -DROP_H * (1 - E.outBack(clamp((f - DROP_AT[i]) / DROP_DUR)));

/** 翻面角度：180＝背面朝上，0＝正面。前 8 格加速甩過來，打到正面那格最快，再過衝 6° 回正 */
export const flipAngle = (f: number, b: number) => {
	const swing = 9;
	if (f < b - swing) return 180;
	if (f <= b) return 180 * (1 - E.inCubic(clamp((f - (b - swing)) / swing)));
	const u = (f - b) / 14;
	if (u >= 1) return 0;
	return -6 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - u * 0.5);
};

/** 定格呼吸：錯開相位、±6px，第 3 張翻完後（970 起）慢慢加進來（不跳） */
export const breathe = (f: number, i: number) =>
	6 * Math.sin(((f - 970) / 84) * Math.PI * 2 + i * 2.1) * prog(f, 970, 24, E.inOutSine);

/* ------------------------------------------------------------------ */
/* 背面：accent 細格線＋大等寬編號                                        */
/* ------------------------------------------------------------------ */
const Back: React.FC<{n: string; i: number}> = ({n, i}) => {
	const id = `angS3grid${i}`;
	const inset = 16;
	const w = CARD.w;
	const h = CARD.h;
	const arm = 14;
	const corners: [number, number, number, number][] = [
		[inset, inset, 1, 1],
		[w - inset, inset, -1, 1],
		[inset, h - inset, 1, -1],
		[w - inset, h - inset, -1, -1],
	];
	return (
		<div style={{position: 'absolute', inset: 0, borderRadius: CARD.r, background: C.ink, overflow: 'hidden'}}>
			<svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
				<defs>
					<pattern id={id} width={26} height={26} patternUnits="userSpaceOnUse" x={inset} y={inset}>
						<path d="M26,0 L0,0 L0,26" fill="none" stroke={alpha(C.accent, 0.2)} strokeWidth={1} />
					</pattern>
				</defs>
				<rect x={inset} y={inset} width={w - inset * 2} height={h - inset * 2} fill={`url(#${id})`} />
				{corners.map(([x, y, sx, sy], k) => (
					<g key={k}>
						<line x1={x} y1={y} x2={x + sx * arm} y2={y} stroke={C.accent} strokeWidth={2} />
						<line x1={x} y1={y} x2={x} y2={y + sy * arm} stroke={C.accent} strokeWidth={2} />
					</g>
				))}
			</svg>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: F.mono,
					fontWeight: 700,
					fontSize: 132,
					color: C.accent,
					letterSpacing: '-0.02em',
				}}
			>
				{n}
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* 正面：accent 小方塊＋等寬編號、大字、細線、小字                        */
/* ------------------------------------------------------------------ */
const Front: React.FC<{n: string; big: string; small: string; sq: number}> = ({n, big, small, sq}) => (
	<div style={{position: 'absolute', inset: 0, borderRadius: CARD.r, background: C.ink, overflow: 'hidden'}}>
		<div
			style={{
				position: 'absolute',
				left: 28,
				top: 34,
				width: 14,
				height: 14,
				background: C.accent,
				transform: `scale(${sq})`,
			}}
		/>
		<div style={{position: 'absolute', left: 54, top: 27, fontFamily: F.mono, fontSize: 22, lineHeight: '28px', color: C.accent, letterSpacing: '0.06em'}}>
			{n}
		</div>
		<div
			style={{
				position: 'absolute',
				left: 26,
				top: 118,
				fontFamily: F.display,
				fontWeight: 900,
				fontSize: 78,
				lineHeight: '92px',
				color: C.paper,
				whiteSpace: 'pre',
			}}
		>
			{big}
		</div>
		<div style={{position: 'absolute', left: 28, right: 28, top: 268, height: 2, background: alpha(C.paper, 0.18)}} />
		<div
			style={{
				position: 'absolute',
				left: 28,
				top: 292,
				fontFamily: F.sans,
				fontWeight: 500,
				fontSize: 36,
				lineHeight: '44px',
				color: alpha(C.paper, 0.75),
				whiteSpace: 'pre',
			}}
		>
			{small}
		</div>
	</div>
);

/* ------------------------------------------------------------------ */
/* 一張卡：落下（殘影＋垂直模糊＋落地壓扁）→ 蓄力微縮 → 翻面（水平模糊）     */
/* ------------------------------------------------------------------ */
export const FlipCard: React.FC<{i: number; f: number}> = ({i, f}) => {
	const d0 = DROP_AT[i];
	if (f < d0) return null;
	const b = FLIP_AT[i];
	const x = CARD_XS[i];
	const card = CARDS[i];

	// 落下
	const dy = dropY(f, i);
	const vy = dropY(f + 0.5, i) - dropY(f - 0.5, i);
	const op = prog(f, d0, 4, E.outCubic);
	const land = pulseAt(f, [d0 + 6], 10, 1) - 1; // 0..1 落地壓扁
	const sqX = 1 + 0.035 * land;
	const sqY = 1 - 0.06 * land;

	// 翻面
	const a = flipAngle(f, b);
	// 往前看一格的角速度：甩的過程模糊，打到正面那格（已經停住）清楚
	const va = flipAngle(f + 1, b) - flipAngle(f, b);
	const antic = prog(f, b - 17, 8, E.inOutSine) - prog(f, b - 3, 3, E.outCubic); // 蓄力微縮 0.96，打下去前放開
	const slap = pulseAt(f, [b], 12, 1) - 1;
	const s = 1 - 0.04 * antic + 0.035 * slap;
	const front = Math.cos((a * Math.PI) / 180) >= 0;
	const shown = front ? a : a - 180;
	const sq = front ? lerp(0, 1, prog(f, b + 2, 10, E.outBack)) * pulseAt(f, [1020 + i * 4, 1050 + i * 4], 10, 0.35) : 0;

	const y = CARD.y + dy + breathe(f, i);
	return (
		<DirBlur
			x={Math.abs(va) * 0.09}
			y={Math.abs(vy) * 0.18}
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: CARD.w,
				height: CARD.h,
				opacity: op,
				transform: `scale(${sqX}, ${sqY})`,
				transformOrigin: '50% 100%',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `perspective(1200px) rotateY(${shown.toFixed(3)}deg) scale(${s.toFixed(4)})`,
					transformOrigin: '50% 50%',
				}}
			>
				{front ? <Front n={card.n} big={card.big} small={card.small} sq={sq} /> : <Back n={card.n} i={i} />}
			</div>
		</DirBlur>
	);
};

/** 落下殘影（畫在卡片後面，SVG 一層） */
export const DropGhosts: React.FC<{f: number}> = ({f}) => (
	<g>
		{CARD_XS.map((x, i) => {
			if (f < DROP_AT[i] || f > DROP_AT[i] + 8) return null;
			const now = dropY(f, i);
			const v = Math.abs(dropY(f + 0.5, i) - dropY(f - 0.5, i));
			if (v < 8) return null;
			return [1, 2, 3].map((k) => {
				const gf = f - k * 1.4;
				if (gf < DROP_AT[i]) return null;
				const yy = dropY(gf, i);
				if (Math.abs(yy - now) < 6) return null;
				return (
					<rect
						key={`${i}-${k}`}
						x={x}
						y={CARD.y + yy}
						width={CARD.w}
						height={CARD.h}
						rx={CARD.r}
						fill={alpha(C.ink, 0.2 * (1 - (k - 1) / 3))}
					/>
				);
			});
		})}
	</g>
);
