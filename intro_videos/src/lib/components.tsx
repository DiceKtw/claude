// 共用元件（唯讀：場景檔只能使用，不准修改；缺什麼請在場景檔裡自己做小元件）
import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {Brand, F} from './theme';
import {E, Ease, alpha, burst, clamp, lerp, prog, rng} from './motion';

const safeId = (raw: string) => 'k' + raw.replace(/[^a-zA-Z0-9]/g, '');

/* ------------------------------------------------------------------ */
/* 方向性動態模糊：x / y 是 SVG 高斯模糊的 stdDeviation（0 = 不模糊）      */
/* ------------------------------------------------------------------ */
export const DirBlur: React.FC<{
	x?: number;
	y?: number;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({x = 0, y = 0, style, children}) => {
	const id = safeId(useId());
	const bx = Math.min(40, Math.abs(x));
	const by = Math.min(40, Math.abs(y));
	const on = bx > 0.15 || by > 0.15;
	return (
		<>
			{on ? (
				<svg width={0} height={0} style={{position: 'absolute'}}>
					<filter id={id} x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
					</filter>
				</svg>
			) : null}
			<div style={{...style, filter: on ? `url(#${id})` : undefined}}>{children}</div>
		</>
	);
};

/* ------------------------------------------------------------------ */
/* 文字寬度估計（全形 1em、半形約 0.58em、等寬 0.6em），排版用             */
/* ------------------------------------------------------------------ */
export const isWide = (ch: string) => /[⺀-鿿豈-﫿＀-￯　-〿]/.test(ch);
export const textWidth = (s: string, size: number, mono = false, tracking = 0) =>
	Array.from(s).reduce((w, ch) => w + (isWide(ch) ? size : size * (mono ? 0.6 : 0.58)) + tracking * size, 0);

/* ------------------------------------------------------------------ */
/* 逐字遮罩升起：字從基線下方的遮罩裡升上來，速度快時帶垂直模糊            */
/* segments 讓同一行裡某些字換色／換粗細                                   */
/* quiet = Akira 模式：位移較短＋淡入、沒有模糊                             */
/* ------------------------------------------------------------------ */
export type Seg = {text: string; color?: string; weight?: number};

export const MaskRise: React.FC<{
	segments: Seg[] | string;
	start: number; // 第一個字開始的格數（要讓「落拍」那格剛好升到 3/4，就提前 4 格起跑）
	f: number; // 目前格數（全域）
	size: number;
	color: string;
	weight?: number;
	family?: string;
	stagger?: number; // 每字錯開幾格
	dur?: number; // 每字升起要幾格
	tracking?: number; // 字距（em）
	lineHeight?: number;
	quiet?: boolean;
	exitAt?: number; // 從這格開始往上收掉（選用）
	exitDur?: number;
	style?: React.CSSProperties;
}> = ({
	segments,
	start,
	f,
	size,
	color,
	weight = 700,
	family = F.display,
	stagger = 3,
	dur = 18,
	tracking = 0,
	lineHeight = 1.18,
	quiet = false,
	exitAt,
	exitDur = 14,
	style,
}) => {
	const segs: Seg[] = typeof segments === 'string' ? [{text: segments}] : segments;
	const chars: {ch: string; color: string; weight: number}[] = [];
	for (const s of segs) for (const ch of Array.from(s.text)) chars.push({ch, color: s.color ?? color, weight: s.weight ?? weight});
	const h = size * lineHeight;
	const ease: Ease = E.outExpo;
	return (
		<div style={{display: 'flex', overflow: 'hidden', height: h, lineHeight: `${h}px`, ...style}}>
			{chars.map((c, i) => {
				const s0 = start + i * stagger;
				const pos = (ff: number) => {
					const p = ease(clamp((ff - s0) / dur));
					let y = (1 - p) * h * (quiet ? 0.45 : 1.05);
					if (exitAt !== undefined) {
						const q = E.inExpo(clamp((ff - (exitAt + i * Math.max(1, stagger - 1))) / exitDur));
						y -= q * h * 1.05;
					}
					return y;
				};
				const y = pos(f);
				const v = pos(f + 0.5) - pos(f - 0.5);
				const op = quiet ? clamp((f - s0) / (dur * 0.7)) : 1;
				return (
					<DirBlur key={i} y={quiet ? 0 : Math.abs(v) * 0.2}>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${y}px)`,
								opacity: op,
								fontFamily: family,
								fontSize: size,
								fontWeight: c.weight,
								color: c.color,
								letterSpacing: `${tracking}em`,
								whiteSpace: 'pre',
							}}
						>
							{c.ch}
						</span>
					</DirBlur>
				);
			})}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* 打字＋游標：剛打出來的字先是 hotColor，hotFrames 格後變回 color         */
/* ------------------------------------------------------------------ */
export const Typewriter: React.FC<{
	text: string;
	start: number;
	f: number;
	every?: number; // 幾格打一個字
	size: number;
	color: string;
	hotColor?: string;
	hotFrames?: number;
	cursorColor?: string;
	cursor?: boolean;
	cursorUntil?: number; // 游標顯示到哪一格（預設一直在）
	family?: string;
	weight?: number;
	tracking?: number;
	fadeChars?: boolean; // Akira：字用淡入，不閃色
	reserve?: boolean; // 還沒打的字先佔位（透明），版面寬度固定，靠右對齊時不會跳
	style?: React.CSSProperties;
}> = ({
	text,
	start,
	f,
	every = 2,
	size,
	color,
	hotColor,
	hotFrames = 2,
	cursorColor,
	cursor = true,
	cursorUntil,
	family = F.sans,
	weight = 500,
	tracking = 0,
	fadeChars = false,
	reserve = false,
	style,
}) => {
	const chars = Array.from(text);
	const typed = f < start ? 0 : Math.min(chars.length, Math.floor((f - start) / every) + 1);
	const done = typed >= chars.length;
	const doneAt = start + (chars.length - 1) * every;
	const blinkOn = !done || Math.floor((f - doneAt) / 15) % 2 === 0;
	const showCursor = cursor && f >= start - 6 && (cursorUntil === undefined || f < cursorUntil) && blinkOn;
	return (
		<div style={{display: 'flex', alignItems: 'center', whiteSpace: 'pre', ...style}}>
			{(reserve ? chars : chars.slice(0, typed)).map((ch, i) => {
				const at = start + i * every;
				const hot = hotColor && f - at < hotFrames;
				const op = i >= typed ? 0 : fadeChars ? clamp((f - at) / 8) : 1;
				return (
					<span
						key={i}
						style={{
							fontFamily: family,
							fontSize: size,
							fontWeight: weight,
							color: hot ? hotColor : color,
							letterSpacing: `${tracking}em`,
							opacity: op,
						}}
					>
						{ch}
					</span>
				);
			})}
			{showCursor ? (
				<span
					style={{
						display: 'inline-block',
						width: size * 0.5,
						height: size * 0.95,
						marginLeft: size * 0.08,
						background: cursorColor ?? hotColor ?? color,
					}}
				/>
			) : null}
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* 描線：SVG path 依 p (0→1) 畫出來                                       */
/* ------------------------------------------------------------------ */
export const DrawPath: React.FC<{
	d: string;
	p: number;
	color: string;
	width: number;
	fill?: string;
	cap?: 'round' | 'butt' | 'square';
	dash?: string; // 虛線樣式（會跟描線進度一起作用：用 mask 畫）
	opacity?: number;
}> = ({d, p, color, width, fill = 'none', cap = 'round', dash, opacity = 1}) => {
	const id = safeId(useId());
	if (p <= 0) return null;
	if (!dash) {
		return (
			<path
				d={d}
				pathLength={1}
				fill={fill}
				stroke={color}
				strokeWidth={width}
				strokeLinecap={cap}
				strokeLinejoin="round"
				strokeDasharray={`${clamp(p)} 2`}
				opacity={opacity}
			/>
		);
	}
	return (
		<g opacity={opacity}>
			<mask id={id} maskUnits="userSpaceOnUse">
				<path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 4} strokeDasharray={`${clamp(p)} 2`} strokeLinecap="butt" />
			</mask>
			<path d={d} fill={fill} stroke={color} strokeWidth={width} strokeLinecap={cap} strokeDasharray={dash} mask={`url(#${id})`} />
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 引線（量測線）：從 (x1,y1) 畫到 (x2,y2)，可虛線、端點小圓點             */
/* ------------------------------------------------------------------ */
export const Leader: React.FC<{
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	p: number;
	color: string;
	width?: number;
	dash?: string;
	dotStart?: boolean;
	dotEnd?: boolean;
	opacity?: number;
}> = ({x1, y1, x2, y2, p, color, width = 2, dash = '6 7', dotStart = true, dotEnd = false, opacity = 1}) => {
	if (p <= 0) return null;
	const xe = lerp(x1, x2, clamp(p));
	const ye = lerp(y1, y2, clamp(p));
	return (
		<g opacity={opacity}>
			<line x1={x1} y1={y1} x2={xe} y2={ye} stroke={color} strokeWidth={width} strokeDasharray={dash} />
			{dotStart ? <circle cx={x1} cy={y1} r={width * 2} fill={color} /> : null}
			{dotEnd && p >= 1 ? <circle cx={x2} cy={y2} r={width * 2} fill={color} /> : null}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 12 道光的星芒（光芒不照順序一道一道噴出來，有速度、有回彈）             */
/* ------------------------------------------------------------------ */
const RAY_ORDER = [0, 7, 3, 10, 5, 1, 8, 4, 11, 6, 2, 9];
export const sparkRays = (f: number, start: number, gap = 2, dur = 16) =>
	Array.from({length: 12}, (_, i) => burst(f, start + RAY_ORDER.indexOf(i) * gap, dur));

export const Spark: React.FC<{
	cx: number;
	cy: number;
	size: number; // 外徑
	rays: number[] | number; // 每道光的長度 0..1
	color: string;
	rotate?: number; // 度
	core?: number; // 中心圓半徑（0 = 不畫）
	coreColor?: string;
	rayWidth?: number; // 光芒最寬處（相對 size）
}> = ({cx, cy, size, rays, color, rotate = 0, core = 0, coreColor, rayWidth = 0.075}) => {
	const R = size / 2;
	const arr = typeof rays === 'number' ? Array(12).fill(rays) : rays;
	return (
		<g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
			{arr.map((p, i) => {
				if (p <= 0.001) return null;
				const L = R * p;
				const r0 = core * 0.6;
				const w = R * rayWidth;
				const a = (i * 30 * Math.PI) / 180;
				const ux = Math.cos(a);
				const uy = Math.sin(a);
				const px = -uy;
				const py = ux;
				const mid = r0 + (L - r0) * 0.28;
				const pts = [
					[ux * r0, uy * r0],
					[ux * mid + px * w, uy * mid + py * w],
					[ux * L, uy * L],
					[ux * mid - px * w, uy * mid - py * w],
				]
					.map((q) => q.map((v) => v.toFixed(2)).join(','))
					.join(' ');
				return <polygon key={i} points={pts} fill={color} />;
			})}
			{core > 0 ? <circle r={core} fill={coreColor ?? color} /> : null}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 震波環：從中心擴散變淡                                                 */
/* ------------------------------------------------------------------ */
export const Ring: React.FC<{
	cx: number;
	cy: number;
	f: number;
	start: number;
	dur?: number;
	r0?: number;
	r1?: number;
	w0?: number;
	color: string;
}> = ({cx, cy, f, start, dur = 44, r0 = 30, r1 = 520, w0 = 2, color}) => {
	const t = (f - start) / dur;
	if (t < 0 || t > 1) return null;
	const p = E.outExpo(t);
	return <circle cx={cx} cy={cy} r={lerp(r0, r1, p)} fill="none" stroke={color} strokeWidth={Math.max(0.01, w0 * (1 - p))} opacity={1 - t * 0.6} />;
};

/* ------------------------------------------------------------------ */
/* 衝擊小撇：真正「接觸」那一格，兩側各踢兩道細撇                         */
/* ------------------------------------------------------------------ */
export const ImpactFlicks: React.FC<{
	x: number;
	y: number;
	f: number;
	start: number;
	dur?: number;
	color: string;
	width?: number;
	spread?: number; // 離中心多遠開始
	len?: number;
}> = ({x, y, f, start, dur = 11, color, width = 3, spread = 34, len = 36}) => {
	const t = (f - start) / dur;
	if (t < 0 || t > 1) return null;
	const head = E.outExpo(t);
	const tail = E.inOutSine(t);
	const angles = [-160, -135, -45, -20];
	return (
		<g>
			{angles.map((deg, i) => {
				const a = (deg * Math.PI) / 180;
				const r1 = spread + len * head;
				const r0 = spread + len * tail;
				return (
					<line
						key={i}
						x1={x + Math.cos(a) * r0}
						y1={y + Math.sin(a) * r0}
						x2={x + Math.cos(a) * r1}
						y2={y + Math.sin(a) * r1}
						stroke={color}
						strokeWidth={width}
						strokeLinecap="round"
					/>
				);
			})}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 細線掃光：一道光沿水平線從 x0 掃到 x1，頭快尾慢                        */
/* ------------------------------------------------------------------ */
export const Glint: React.FC<{
	x0: number;
	x1: number;
	y: number;
	f: number;
	start: number;
	dur?: number;
	color: string;
	width?: number;
}> = ({x0, x1, y, f, start, dur = 40, color, width = 2}) => {
	const t = (f - start) / dur;
	if (t < 0 || t > 1) return null;
	const head = lerp(x0, x1, E.outExpo(clamp(t * 1.25)));
	const tail = lerp(x0, x1, E.inOutSine(t));
	if (head - tail < 0.5) return null;
	return <line x1={tail} y1={y} x2={head} y2={y} stroke={color} strokeWidth={width + 1} strokeLinecap="round" />;
};

/* ------------------------------------------------------------------ */
/* 規格列（tick-pop）：小方塊彈出 → 標籤擦入 → 點狀引線 → 數值逐字打       */
/* quiet = Akira：短槓淡入、標籤淡入滑入、細線、數值逐字淡入               */
/* ------------------------------------------------------------------ */
export const SpecRow: React.FC<{
	f: number;
	b: number; // 這一列的拍點
	x: number;
	y: number; // 文字中線
	width: number;
	index?: string;
	label: string;
	value: string;
	brand: Brand;
	ink: string; // 這一列文字主色（亮底給深色、深底給亮色）
	labelColor?: string;
	size?: number;
	quiet?: boolean;
}> = ({f, b, x, y, width, index, label, value, brand, ink, labelColor, size = 36, quiet = false}) => {
	const lab = labelColor ?? brand.muted;
	const labelSize = size * 0.9;
	const idxW = index ? 48 : 0;
	const labelX = x + 30 + idxW;
	const labelW = textWidth(label, labelSize, false, quiet ? 0.12 : 0.04);
	const valueW = textWidth(value, size);
	const leadX0 = labelX + labelW + 18;
	const leadX1 = x + width - valueW - 18;
	// 小方塊
	const sq = quiet ? prog(f, b - 4, 14, E.outCubic) : prog(f, b - 1, 9, E.outBack);
	const sqRot = quiet ? 0 : (1 - prog(f, b - 1, 9, E.outExpo)) * 90;
	const lw = quiet ? prog(f, b, 18, E.outCubic) : prog(f, b, 12, E.outExpo);
	const ld = prog(f, b + 6, quiet ? 18 : 10, E.outCubic);
	const typeStart = b + (quiet ? 12 : 8);
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
			{/* 小方塊／短槓 */}
			<div
				style={{
					position: 'absolute',
					left: x,
					top: y - (quiet ? 2 : 7),
					width: quiet ? 18 : 14,
					height: quiet ? 4 : 14,
					background: brand.accent,
					opacity: quiet ? sq : 1,
					transform: quiet ? `translateX(${(1 - sq) * -10}px)` : `scale(${sq}) rotate(${sqRot}deg)`,
				}}
			/>
			{index ? (
				<div
					style={{
						position: 'absolute',
						left: x + 30,
						top: y - 14,
						fontFamily: F.mono,
						fontSize: 22,
						lineHeight: '28px',
						color: brand.accent,
						opacity: lw,
					}}
				>
					{index}
				</div>
			) : null}
			{/* 標籤 */}
			<div
				style={{
					position: 'absolute',
					left: labelX,
					top: y - labelSize * 0.7,
					fontFamily: F.sans,
					fontSize: labelSize,
					fontWeight: 500,
					lineHeight: `${labelSize * 1.4}px`,
					color: lab,
					letterSpacing: `${quiet ? 0.12 : 0.04}em`,
					whiteSpace: 'pre',
					clipPath: quiet ? undefined : `inset(0 ${(1 - lw) * 100}% 0 0)`,
					opacity: quiet ? lw : 1,
					transform: quiet ? `translateX(${(1 - lw) * 12}px)` : undefined,
				}}
			>
				{label}
			</div>
			{/* 引線 */}
			<svg width="100%" height="100%" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				{ld > 0 && leadX1 > leadX0 ? (
					<line
						x1={leadX0}
						y1={y + 2}
						x2={lerp(leadX0, leadX1, ld)}
						y2={y + 2}
						stroke={quiet ? alpha(brand.muted, 0.8) : lab}
						strokeWidth={quiet ? 1.5 : 2.5}
						strokeDasharray={quiet ? undefined : '2 9'}
						strokeLinecap="round"
					/>
				) : null}
			</svg>
			{/* 數值（靠右對齊，未打的字先佔位） */}
			<div style={{position: 'absolute', right: 1080 - (x + width), top: y - size * 0.72, display: 'flex', justifyContent: 'flex-end'}}>
				<Typewriter
					text={value}
					start={typeStart}
					f={f}
					every={2}
					size={size}
					color={ink}
					hotColor={quiet ? undefined : brand.accent}
					hotFrames={4}
					cursor={false}
					weight={700}
					fadeChars={quiet}
					reserve
					style={{lineHeight: `${size * 1.45}px`}}
				/>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* 底片顆粒、暗角                                                         */
/* ------------------------------------------------------------------ */
export const Grain: React.FC<{f: number; opacity?: number}> = ({f, opacity = 0.06}) => {
	const id = safeId(useId());
	const seed = (Math.floor(f / 2) % 12) + 1;
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: 'overlay'}}>
			<svg width="100%" height="100%">
				<filter id={id}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#${id})`} />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.45, color = '#000'}) => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, ${alpha(color, strength)} 100%)`,
		}}
	/>
);

/* ------------------------------------------------------------------ */
/* 慢推＋視差：定格時也不能死                                             */
/* ------------------------------------------------------------------ */
export const Push: React.FC<{
	f: number;
	from: number;
	to: number;
	amount?: number; // 1→1+amount
	originX?: number;
	originY?: number;
	children: React.ReactNode;
}> = ({f, from, to, amount = 0.018, originX = 540, originY = 800, children}) => {
	const s = 1 + amount * prog(f, from, to - from, E.inOutSine);
	return (
		<AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${originX}px ${originY}px`}}>{children}</AbsoluteFill>
	);
};

/** 漂移量：在 [from,to] 之間慢慢漂 px 像素（視差用） */
export const drift = (f: number, from: number, to: number, px: number) => px * prog(f, from, to - from, E.inOutSine);

/** 殘影：回傳過去幾格的取樣（給快速移動的物體畫越來越淡的拖影） */
export const ghostFrames = (f: number, n = 3, step = 1.2) => Array.from({length: n}, (_, i) => ({f: f - (i + 1) * step, o: 0.35 * (1 - i / n)}));

/** 固定亂數散佈（同 seed 永遠同一組點） */
export const scatter = (seed: number, n: number, w: number, h: number) => {
	const r = rng(seed);
	return Array.from({length: n}, () => ({x: r() * w, y: r() * h, s: r()}));
};

/** 全畫面 SVG 圖層（座標＝畫面像素） */
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<AbsoluteFill style={{pointerEvents: 'none', ...style}}>
		<svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow: 'visible'}}>
			{children}
		</svg>
	</AbsoluteFill>
);

/** 絕對定位的文字盒 */
export const Abs: React.FC<{x: number; y: number; style?: React.CSSProperties; children: React.ReactNode}> = ({x, y, style, children}) => (
	<div style={{position: 'absolute', left: x, top: y, ...style}}>{children}</div>
);
