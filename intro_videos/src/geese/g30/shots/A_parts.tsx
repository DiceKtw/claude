// 30 秒〈一格一位〉鏡頭 A／B 共用：開場構圖（那一格＋6 個「客」＋V 字小隊＋直排黑框）
// A 跟 B 是同一個構圖接著演，所以兩個鏡頭都畫這個舞台，格數是全域的、一格一格接得上。
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {DirBlur} from '../../../lib/components';
import {E, clamp, lerp, prog, rng} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {Cell, Line, VBox, b30, slideIn} from '../kit';

/* ------------------------------------------------------------------ */
/* 版面                                                                 */
/* ------------------------------------------------------------------ */
export const CELL = {x: 90, y: 520, s: 420} as const; // 那一格（左半）
const IN = {x: CELL.x + 10, y: CELL.y + 10, s: 400} as const; // 格子內框
export const VB = {x: 570, y: 330, w: 300, h: 750} as const; // 右邊直排黑框
const KE = 132; // 擠在格子裡的「客」字級
const BIG = 2.3; // 留下來那個放大倍數（≈300px）

// 拍點
const BEAT2 = b30(1); // 28：5 個彈出
const BEAT3 = b30(2); // 56：剩 1 個放大、格子填黃
const BEAT4 = b30(3); // 84：直排黑框拉門
// 小節 2（B 段）：附屬句在正拍就落下（多給閱讀時間）；拍 1、3、4 框裡的直排字被大鼓震一下
const B_LINE_AT = b30(4); // 113
const B_KICKS = [b30(4), b30(6), b30(7)]; // 113 169 197

/* ------------------------------------------------------------------ */
/* 紙底（效能版）：跟 kit 的 Paper 同色、同樣 3% 灰階紙紋，                */
/* 但紋理只在掛載時用 canvas 畫一次（rng 固定種子），之後每格只是合成。     */
/* kit 的 Paper 每格重算整張 feTurbulence，單這一層就要 1 秒以上。          */
/* ------------------------------------------------------------------ */
let NOISE: ImageData | null = null;
const paintNoise = (ctx: CanvasRenderingContext2D) => {
	if (!NOISE) {
		NOISE = ctx.createImageData(1080, 1920);
		const d = NOISE.data;
		const r = rng(30_0003);
		for (let i = 0; i < d.length; i += 4) {
			const v = 96 + r() * 64; // 灰階，平均 128（feTurbulence fractalNoise 去飽和後的分佈）
			d[i] = v;
			d[i + 1] = v;
			d[i + 2] = v;
			d[i + 3] = 48 + r() * 48; // 透明度平均約 0.28（實測後對齊 kit Paper 的平均紙色）
		}
	}
	ctx.putImageData(NOISE, 0, 0);
};
export const PaperFast: React.FC = () => {
	const ref = useRef<HTMLCanvasElement>(null);
	useLayoutEffect(() => {
		const ctx = ref.current?.getContext('2d');
		if (ctx) paintNoise(ctx);
	}, []);
	return (
		<AbsoluteFill style={{background: G.paper}}>
			<canvas ref={ref} width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: 0.03}} />
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* 小工具                                                               */
/* ------------------------------------------------------------------ */
/** 衰減正弦（t<0 為 0）：彈簧的餘震 */
export const ring = (t: number, w: number, tau: number) => (t < 0 ? 0 : Math.sin(w * t) * Math.exp(-t / tau));
/** 衰減餘弦（t<0 為 1）：從壓縮狀態放開 */
const ringC = (t: number, w: number, tau: number) => (t < 0 ? 1 : Math.cos(w * t) * Math.exp(-t / tau));

/** 一個置中的字（以字的中心定位） */
export const Glyph: React.FC<{
	ch: string;
	x: number;
	y: number;
	size: number;
	rot?: number;
	scale?: number;
	color?: string;
	weight?: number;
	origin?: string;
	blur?: {x: number; y: number};
	/** 沿運動方向的拉絲模糊：len＝模糊量，ang＝運動方向（度） */
	streak?: {len: number; ang: number};
}> = ({ch, x, y, size, rot = 0, scale = 1, color = G.ink, weight = 900, origin = '50% 50%', blur, streak}) => {
	if (streak && streak.len > 0.3) {
		const B = size * 1.5;
		return (
			<div style={{position: 'absolute', left: x - B / 2, top: y - B / 2, width: B, height: B, transform: `rotate(${streak.ang.toFixed(2)}deg)`}}>
				<DirBlur x={streak.len} style={{position: 'absolute', inset: 0}}>
					<div
						lang="zh-Hant-TW"
						style={{
							position: 'absolute',
							left: (B - size) / 2,
							top: (B - size) / 2,
							width: size,
							height: size,
							lineHeight: `${size}px`,
							textAlign: 'center',
							fontFamily: F.round,
							fontWeight: weight,
							fontSize: size,
							color,
							transform: `rotate(${(rot - streak.ang).toFixed(3)}deg) scale(${scale.toFixed(4)})`,
							whiteSpace: 'pre',
						}}
					>
						{ch}
					</div>
				</DirBlur>
			</div>
		);
	}
	const el = (left: number, top: number) => (
		<div
			lang="zh-Hant-TW"
			style={{
				position: 'absolute',
				left,
				top,
				width: size,
				height: size,
				lineHeight: `${size}px`,
				textAlign: 'center',
				fontFamily: F.round,
				fontWeight: weight,
				fontSize: size,
				color,
				transform: `rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
				transformOrigin: origin,
				whiteSpace: 'pre',
			}}
		>
			{ch}
		</div>
	);
	if (!blur || (Math.abs(blur.x) < 0.2 && Math.abs(blur.y) < 0.2)) return el(x - size / 2, y - size / 2);
	// 模糊只包住字附近的小盒子，盒子裡只放字本身（不放全畫面子層，否則濾鏡範圍會被撐成整張）
	const B = size * Math.max(1.2, scale * 1.2);
	return (
		<DirBlur x={blur.x} y={blur.y} style={{position: 'absolute', left: x - B / 2, top: y - B / 2, width: B, height: B}}>
			{el((B - size) / 2, (B - size) / 2)}
		</DirBlur>
	);
};

/** 直排字（不帶框；放進 VBox 當 children，才能讓字有自己的慣性） */
export const VText: React.FC<{text: string; size: number; weight?: number; color?: string; dx?: number; dy?: number; lh?: number}> = ({
	text,
	size,
	weight = 900,
	color = G.ink,
	dx = 0,
	dy = 0,
	lh = 1.05,
}) => (
	<div
		lang="zh-Hant-TW"
		style={{
			writingMode: 'vertical-rl',
			textOrientation: 'upright',
			fontFamily: F.round,
			fontWeight: weight,
			fontSize: size,
			color,
			// 直排兩欄的欄距：lh 是欄寬（字級倍數）。預設 1.05；兩欄句子用 1.2 以上，欄距約 0.2em，才不會被橫著讀
			lineHeight: lh,
			letterSpacing: '0.04em',
			whiteSpace: 'pre',
			transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`,
		}}
	>
		{text}
	</div>
);

/**
 * 「1 小時」小標（開場、回到那一格、抽鼓那兩拍共用）：墨色、數字用 Anybody 窄體。
 * 這是讓人看懂「一格＝一個小時」的唯一線索，所以不用鉛筆灰小字（手機上對比不夠、太小）。
 * reveal：由左往右擦出的進度（0–1）。左上角定位；下緣約在格子上緣上方 16px。
 */
export const HOUR_H = 72;
export const HourLabel: React.FC<{x: number; y: number; reveal?: number}> = ({x, y, reveal = 1}) => {
	const [num, ...rest] = C30.A.hour.split(' ');
	return (
		<div
			lang="zh-Hant-TW"
			style={{
				position: 'absolute',
				left: x,
				top: y,
				height: HOUR_H,
				display: 'flex',
				alignItems: 'baseline',
				color: G.ink,
				whiteSpace: 'pre',
				lineHeight: `${HOUR_H}px`,
				clipPath: reveal < 1 ? `inset(0 ${((1 - reveal) * 100).toFixed(2)}% 0 0)` : undefined,
				transform: reveal < 1 ? `translateX(${((1 - reveal) * -14).toFixed(2)}px)` : undefined,
			}}
		>
			<span style={{fontFamily: F.num, fontWeight: 900, fontStretch: '75%', fontSize: 72}}>{num}</span>
			<span style={{fontFamily: F.round, fontWeight: 700, fontSize: 50}}>{' ' + rest.join(' ')}</span>
		</div>
	);
};
/** 小標的位置：格子上方（左緣齊格子） */
export const hourPos = (cell: {x: number; y: number}) => ({x: cell.x - 2, y: cell.y - HOUR_H - 14});

/* ------------------------------------------------------------------ */
/* 6 個「客」：擠一團 → 5 個排 V 字往右上彈出 → 剩 1 個                   */
/* ------------------------------------------------------------------ */
// 格子內座標（0–400），中心 (200,200)。5 號是留下來的那個（左下角，離出口最遠）
const PILE = [
	{x: 94, y: 98, r: -8},
	{x: 256, y: 84, r: 7},
	{x: 334, y: 204, r: 12},
	{x: 196, y: 210, r: -4},
	{x: 300, y: 326, r: -10},
	{x: 104, y: 314, r: 5},
] as const;
const STAY = 5;

// 每個字自己的節奏（rng 固定）
const R = (() => {
	const r = rng(30_0601);
	return PILE.map(() => ({w: 0.34 + r() * 0.16, ph: r() * Math.PI * 2, ph2: r() * Math.PI * 2, ph3: r() * Math.PI * 2}));
})();

// 飛行方向：往右上 45°（兩條翼都斜著，不會排成一橫行被讀成字）
const ANG = (-45 * Math.PI) / 180;
const U = {x: Math.cos(ANG), y: Math.sin(ANG)}; // 前進
const rotV = (v: {x: number; y: number}, deg: number) => {
	const a = (deg * Math.PI) / 180;
	return {x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a)};
};
// V 字兩翼：從領頭往後（-U）各偏 36°，夾角 72°，一眼讀得出是雁陣（像箭頭指向右上）
const ARM = {1: rotV({x: -U.x, y: -U.y}, 36), [-1]: rotV({x: -U.x, y: -U.y}, -36)} as Record<number, {x: number; y: number}>;
const NRM = {x: -U.y, y: U.x}; // 垂直飛行方向（翅膀上下擺）

// V 字隊形：領頭 1 號；兩翼內側先走、外側再晚 3 格
type Slot = {k: number; side: 0 | 1 | -1};
const SLOT: Record<number, Slot> = {1: {k: 0, side: 0}, 2: {k: 1, side: 1}, 3: {k: 1, side: -1}, 4: {k: 2, side: 1}, 0: {k: 2, side: -1}};
const LAUNCH0 = BEAT2 - 2; // 領頭提前 2 格起跑：拍點那格領頭正拉成一道、第一對翅膀剛要出手
const STAG = 3;
const FLY = 34; // 飛到右上角的時間（outExpo）
const PARK = {x: 1000, y: 230}; // 領頭停的位置（右上角，避開直排框；不壓在 Reels 右上角的相機鈕底下）
const GAP = 150; // 沿翼的間距
const FAR = 0.42; // 飛遠後的大小
const BANK = 12; // 飛行時往前傾的角度

/** 擠在格子裡的位置（格子內座標轉畫面座標） */
const pileAt = (i: number, f: number) => {
	const p = PILE[i];
	const r = R[i];
	let ex = p.x - 200;
	let ey = p.y - 200;
	const L = Math.hypot(ex, ey) || 1;
	ex /= L;
	ey /= L;
	const tx = -ey;
	const ty = ex;
	// 第 0 格（大鼓）剛被塞進去：先往內壓，接著彈回來互推
	const kick = -11 * ringC(f, r.w, 15);
	// 持續的擠壓微動（每一格都有位移）
	const jitT = 3.2 * Math.sin(0.83 * f + r.ph);
	const jitR = 2.4 * Math.sin(0.61 * f + r.ph2);
	// 起跑前蓄力：整團往內縮（彈簧上緊）；放開後彈回來
	const loadIn = E.inCubic(clamp((f - (LAUNCH0 - 10)) / 10));
	const load = f < LAUNCH0 ? -13 * loadIn : -13 * ringC(f - LAUNCH0, 0.42, 6);
	const rad = kick + jitR + load;
	const rot = p.r + 3 * Math.sin(0.7 * f + r.ph3) * (0.5 + 0.5 * Math.exp(-f / 20));
	const sc = 1 - 0.035 * (f < LAUNCH0 ? loadIn : ringC(f - LAUNCH0, 0.42, 6));
	return {x: IN.x + p.x + ex * rad + tx * jitT, y: IN.y + p.y + ey * rad + ty * jitT, rot, sc};
};

const launchOf = (i: number) => LAUNCH0 + SLOT[i].k * STAG;

/** 隊形裡的位置：停一下，再慢慢加速往右上飛出畫面（剛好在 B 段結束時離開） */
const parkAt = (i: number, f: number) => {
	const s = SLOT[i];
	const away = 560 * E.inCubic(clamp((f - 66) / 160));
	const flap = s.k === 0 ? 0 : 3.5 * Math.sin(0.21 * f + i * 1.7); // 翅膀那幾個上下微擺
	const arm = s.side === 0 ? {x: 0, y: 0} : ARM[s.side];
	return {
		x: PARK.x + U.x * away + s.k * GAP * arm.x + NRM.x * flap,
		y: PARK.y + U.y * away + s.k * GAP * arm.y + NRM.y * flap,
	};
};

/** 飛出去的字：位置、大小、角度 */
const flyAt = (i: number, f: number) => {
	const t0 = launchOf(i);
	const a = pileAt(i, t0);
	const p = E.outExpo(clamp((f - t0) / FLY));
	const b = parkAt(i, f);
	// 路徑微微往上拱，不是死板直線
	const arc = Math.sin(Math.PI * p) * 40;
	return {
		x: lerp(a.x, b.x, p) - NRM.x * arc,
		y: lerp(a.y, b.y, p) - NRM.y * arc,
		rot: lerp(a.rot, BANK, E.outCubic(clamp(p * 1.3))),
		sc: lerp(a.sc, FAR, p),
	};
};

/** 留下來的那個：被反作用力推往左下 → 回彈 → 拍 3 放大到填滿格子 */
const stayAt = (i: number, f: number) => {
	if (f < LAUNCH0) return pileAt(i, f);
	const base = pileAt(i, f);
	// 其他人往右上蹬出去，它被反推往左下（第三定律），再彈回
	const kick = 24 * ring(f - LAUNCH0, 0.3, 9);
	const x0 = base.x - U.x * kick;
	const y0 = base.y - U.y * kick;
	// 拍 3：提前 3 格起跑，放大（outBack）並移到格子中央
	const gs = BEAT3 - 3;
	const pm = prog(f, gs, 12, E.outExpo);
	const ps = prog(f, gs, 14, E.outBack);
	const cx = IN.x + 200;
	const cy = IN.y + 200;
	// 放大之後：慢呼吸（±0.6%），不死
	const breathe = f > gs + 14 ? 1 + 0.006 * Math.sin(((f - gs - 14) / 56) * Math.PI * 2) : 1;
	return {
		x: lerp(x0, cx, pm),
		y: lerp(y0, cy, pm),
		rot: lerp(base.rot - 4 * ring(f - LAUNCH0, 0.3, 9), 0, pm),
		sc: lerp(base.sc, BIG, ps) * breathe,
	};
};

const velOf = (fn: (ff: number) => {x: number; y: number}, f: number) => {
	const a = fn(f - 0.5);
	const b = fn(f + 0.5);
	return {x: b.x - a.x, y: b.y - a.y};
};

/* ------------------------------------------------------------------ */
/* 舞台                                                                 */
/* ------------------------------------------------------------------ */
export const OpeningStage: React.FC<{f: number; children?: React.ReactNode}> = ({f, children}) => {
	// 「1 小時」小標：從循環接縫前就開始擦（f0 已擦出 97%、還在走），第 0 格就看得到「一格＝1 小時」
	const lab = prog(f, -8, 12, E.outExpo);
	const hp = hourPos(CELL);

	// 直排黑框：拉門從下方滑進；提前 5 格起跑，撞停（進度 0.96）那格落在拍 4 後不到 1 格
	const vbAt = BEAT4 - 5;
	const vbOff = slideIn(f, vbAt, 'bottom', 1620);
	// 框停住後，裡面的字因為慣性多走一點再彈回（框往上停，字往上衝）；小節 2 每下大鼓再被震一下
	let lag = -26 * ring(f - (vbAt + 8), 0.36, 7);
	for (const b of B_KICKS) lag += -8 * ring(f - b, 0.36, 7);
	const vbOn = f >= vbAt;

	// B 段起：框與格子反方向等速微漂（視差，不是移鏡；等速一路推到硬切，不在切點前停住）
	const drift = clamp((f - 100) / 125);

	const pile: React.ReactNode[] = [];
	const flyers: React.ReactNode[] = [];
	PILE.forEach((_, i) => {
		if (i === STAY) return;
		const t0 = launchOf(i);
		if (f < t0) {
			const q = pileAt(i, f);
			pile.push(<Glyph key={i} ch={C30.A.ke} x={q.x} y={q.y} size={KE} rot={q.rot} scale={q.sc} />);
		} else {
			const q = flyAt(i, f);
			if (q.x > 1140 || q.y < -100) return; // 已經飛出畫面
			const v = velOf((ff) => flyAt(i, ff), f);
			const sp = Math.hypot(v.x, v.y);
			flyers.push(
				<Glyph key={i} ch={C30.A.ke} x={q.x} y={q.y} size={KE} rot={q.rot} scale={q.sc} streak={{len: Math.min(30, sp * 0.16), ang: (Math.atan2(v.y, v.x) * 180) / Math.PI}} />,
			);
		}
	});
	const s = stayAt(STAY, f);
	const sv = velOf((ff) => stayAt(STAY, ff), f);

	return (
		<>
			{/* 那一格（拍 3 由下往上填黃） */}
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * 14).toFixed(2)}px)`}}>
				<HourLabel x={hp.x} y={hp.y} reveal={lab} />
				<Cell f={f} x={CELL.x} y={CELL.y} size={CELL.s} fillAt={BEAT3} />
				{/* 還擠在格子裡的（裁在格子內框裡） */}
				<div style={{position: 'absolute', left: IN.x, top: IN.y, width: IN.s, height: IN.s, overflow: 'hidden'}}>
					<div style={{position: 'absolute', left: -IN.x, top: -IN.y, width: 1080, height: 1920}}>
						{pile}
						<Glyph ch={C30.A.ke} x={s.x} y={s.y} size={KE} rot={s.rot} scale={s.sc} origin="50% 50%" blur={{x: Math.abs(sv.x) * 0.12, y: Math.abs(sv.y) * 0.12}} />
					</div>
				</div>
			</div>
			{/* 直排黑框：一個小時，只約一位。 */}
			{vbOn ? (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * -18).toFixed(2)}px)`}}>
					<DirBlur
						y={Math.abs(slideIn(f + 0.5, vbAt, 'bottom', 1620).y - slideIn(f - 0.5, vbAt, 'bottom', 1620).y) * 0.18}
						style={{position: 'absolute', left: VB.x - 20, top: VB.y + vbOff.y - 20, width: VB.w + 40, height: VB.h + 40}}
					>
						<VBox x={20} y={20} w={VB.w} h={VB.h} fill={G.paper} style={{overflow: 'hidden'}}>
							<VText text={C30.A.line.replace('，', '，\n')} size={110} lh={1.22} dy={lag} />
						</VBox>
					</DirBlur>
				</div>
			) : null}
			{/* 小節 2 正拍：下方一行附屬句（A／B 同一個舞台，A 的最後兩格就開始升起） */}
			{f >= B_LINE_AT - 2 ? (
				<Line x={90} y={1150} text={C30.B.line} size={48} weight={500} f={f} at={B_LINE_AT - 2} style={{letterSpacing: '0.04em'}} />
			) : null}
			{/* 飛出去的 V 字小隊（在最上層，越過格子框） */}
			{flyers}
			{children}
		</>
	);
};
