// 60 秒〈字的雁陣〉Texture 的版面（只給 Texture.tsx 用）：
// 兩道筆刷裡填滿 34px 的工作語言紋理字。每一行水平、行距 40–110px 不均、偶爾整段空 1–3 行；
// 每行左右起點微錯；順著筆畫方向留幾道「乾筆飛白」（缺字的斜帶），拉遠時看得出是筆刷。
// 版面在模組載入時算一次（固定亂數），每格只決定哪些字看得到、透明度多少。
import {E, clamp, prog, rng} from '../../../lib/motion';
import {C60} from '../../copy';
import {b60} from '../../theme';
import {ANCHOR, APEX, BAND, BOX, LONG_START, LONG_STROKE, MAP, P, SHORT_END, SHORT_STROKE} from '../world';

export const TEX = {size: 34, weight: 500} as const;
const ASC = 31; // 字墨頂（基線上方）
const DESC = 5; // 字墨底（基線下方）

/* ------------------------------------------------------------------ */
/* 字寬（Chiron GoRound TC 實測前進寬，單位 em；中文 1em）                  */
/* ------------------------------------------------------------------ */
const ADV: Record<string, number> = {S: 0.6, M: 0.844, L: 0.527, X: 0.631};
export const wordW = (s: string) => Array.from(s).reduce((w, ch) => w + (ADV[ch] ?? 1) * TEX.size, 0);

// 排列：報價 確認 服務 ／ S M L XL ／ 剪 燙 染 護 ／ …（「／」不畫，改成大一點的空白）
const T = C60.TEXTURE;
const GROUPS = [
	[0, 1, 2],
	[7, 8, 9, 10],
	[3, 4, 5, 6],
];
const WORD_GAP = 17; // 0.5em
const GROUP_GAP = 58; // 約 1.7em：組與組之間
const SEQ = GROUPS.flatMap((g) => g.map((i, j) => ({text: T[i] as string, gap: j === g.length - 1 ? GROUP_GAP : WORD_GAP})));

/* ------------------------------------------------------------------ */
/* 讓位區：站點的字周圍不畫紋理（clear）或降到 40%（dim）                    */
/* 座標＝站內座標（0–790 × 0–978），at＝那個字開始進場的格數（到時紋理才讓開） */
/* 依各站目前的版面量出來；站點改版面時這張表要跟著改。                       */
/* ------------------------------------------------------------------ */
type Zone = {id: string; x: number; y: number; w: number; h: number; at: number; kind: 'clear' | 'dim'; m: number};
const Z = (id: string, x: number, y: number, w: number, h: number, at: number, kind: 'clear' | 'dim' = 'clear', m = 40): Zone => ({id, x, y, w, h, at, kind, m});
const ZONES_LOCAL: Zone[] = [
	// S1 店名小標／先報價／副句／流程
	Z('S1', 50, 90, 705, 42, 6, 'clear', 12),
	Z('S1', 50, 240, 612, 228, 22),
	Z('S1', 100, 502, 676, 68, 61, 'dim', 40),
	Z('S1', 150, 632, 500, 224, 93, 'clear', 14),
	// S2 燙・染／全程設計師操作
	Z('S2', 60, 326, 600, 250, 281),
	Z('S2', 112, 604, 430, 80, 318, 'dim', 14),
	// S3 每個月／附屬句／Mono 小標（斜 3°）／不定期辦活動（樓梯）／像是…
	Z('S3', 48, 96, 722, 190, 542),
	Z('S3', 104, 322, 566, 68, 608, 'dim', 14),
	Z('S3', 160, 420, 600, 84, 673, 'clear', 12),
	Z('S3', 216, 620, 436, 172, 736, 'clear', 26),
	Z('S3', 272, 836, 486, 60, 768, 'dim', 40),
	// S4 店裡還有（整行紋理一起降，免得讀成「店裡還有 剪 燙 染…」）／廁所備衛生棉／零食櫃
	Z('S4', 64, 226, 726, 68, 913, 'dim', 14),
	Z('S4', 120, 440, 600, 100, 923),
	Z('S4', 420, 696, 330, 110, 1020),
	// S5 Google／4.9¹★／2,400+ 則評論／註腳
	Z('S5', 46, 272, 196, 42, 1171, 'clear', 12),
	Z('S5', 41, 316, 734, 240, 1186),
	Z('S5', 214, 560, 562, 90, 1283, 'clear', 26),
	Z('S5', 46, 772, 620, 40, 1348, 'clear', 12),
	// S6 附設（80px）／夜間洗髮（往左下一字一階）
	Z('S6', 300, 285, 470, 90, 1556, 'dim', 14),
	Z('S6', 50, 515, 170, 190, 1572),
	Z('S6', 220, 475, 170, 190, 1572),
	Z('S6', 390, 435, 170, 190, 1572),
	Z('S6', 560, 395, 170, 190, 1572),
	// S7 上班／開心／是我們的文化／雁｜生活係髮廊
	Z('S7', 250, 170, 460, 230, 1955),
	Z('S7', 190, 402, 460, 230, 1958),
	Z('S7', 130, 660, 362, 74, 2151, 'dim', 40),
	Z('S7', 70, 762, 300, 46, 2184, 'clear', 12),
	// S8 想找你的命定設計師，（引言）／歡迎來／雁沙龍。
	Z('S8', 140, 300, 620, 60, 2330, 'clear', 30),
	Z('S8', 100, 392, 570, 190, 2437),
	Z('S8', 40, 600, 720, 190, 2440),
];
export type WZone = {x0: number; y0: number; x1: number; y1: number; cx: number; at: number; kind: 'clear' | 'dim'};
export const ZONES: WZone[] = ZONES_LOCAL.map((z) => {
	const ox = ANCHOR[z.id].x - BOX.halfW;
	const oy = ANCHOR[z.id].y - BOX.halfH;
	return {x0: ox + z.x - z.m, y0: oy + z.y - z.m, x1: ox + z.x + z.w + z.m, y1: oy + z.y + z.h + z.m, cx: ox + z.x + z.w / 2, at: z.at, kind: z.kind};
});

/* ------------------------------------------------------------------ */
/* S4 的「紋理詞點亮」（S4.tsx 的 FLASH 表）：那幾個詞必須真的是紋理裡的字，   */
/* 這裡把它們釘在同一個位置（站內 x、字框頂 y；SVG 基線＝y＋0.85×34）。         */
/* ------------------------------------------------------------------ */
const PINS_LOCAL: {id: string; text: string; x: number; y: number}[] = [
	{id: 'S4', text: T[6], x: 500, y: 168},
	{id: 'S4', text: T[3], x: 150, y: 604},
	{id: 'S4', text: T[2], x: 590, y: 322},
	{id: 'S4', text: T[5], x: 250, y: 842},
	{id: 'S4', text: T[1], x: 560, y: 892},
	{id: 'S4', text: T[4], x: 708, y: 940},
];
const PINS = PINS_LOCAL.map((p) => ({text: p.text, x: ANCHOR[p.id].x - BOX.halfW + p.x, y: ANCHOR[p.id].y - BOX.halfH + p.y + TEX.size * 0.85}));

/* ------------------------------------------------------------------ */
/* 幾何：掃描線 ∩ 筆刷外框、筆刷座標（沿筆畫 t、橫向 s）                      */
/* ------------------------------------------------------------------ */
const scan = (poly: P[], y: number): [number, number][] => {
	const xs: number[] = [];
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
	}
	xs.sort((p, q) => p - q);
	const out: [number, number][] = [];
	for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
	return out;
};
const spans = (y: number) => {
	const all = [...scan(LONG_STROKE, y), ...scan(SHORT_STROKE, y)].sort((a, b) => a[0] - b[0]);
	const out: [number, number][] = [];
	for (const s of all) {
		const last = out[out.length - 1];
		if (last && s[0] <= last[1] + 12) last[1] = Math.max(last[1], s[1]);
		else out.push([s[0], s[1]]);
	}
	return out;
};

type Stroke = {a: P; b: P; half: number; ux: number; uy: number; len: number};
const mk = (a: P, b: P, width: number): Stroke => {
	const len = Math.hypot(b.x - a.x, b.y - a.y);
	return {a, b, half: width / 2, ux: (b.x - a.x) / len, uy: (b.y - a.y) / len, len};
};
const LONG = mk(LONG_START, APEX, BAND);
const SHORT = mk(APEX, SHORT_END, BAND * 0.92);
const coord = (p: P, s: Stroke) => {
	const dx = p.x - s.a.x;
	const dy = p.y - s.a.y;
	return {t: (dx * s.ux + dy * s.uy) / s.len, s: (dx * -s.uy + dy * s.ux) / s.half};
};
/** 長筆畫方向（左上 → 頂點），開場紋理沿這個方向刷進來 */
export const LONG_DIR = {x: LONG.ux, y: LONG.uy};

// 乾筆飛白：沿筆畫方向的細帶，越靠收筆越多（短筆畫尾巴最乾）
type Dry = {s0: number; s1: number; t0: number; st: Stroke};
const DRY: Dry[] = (() => {
	const r = rng(4417);
	const out: Dry[] = [];
	const add = (st: Stroke, n: number, tMin: number, tMax: number) => {
		for (let i = 0; i < n; i++) {
			const c = -0.88 + 1.76 * r();
			const hw = 0.03 + 0.045 * r();
			out.push({s0: c - hw, s1: c + hw, t0: tMin + (tMax - tMin) * r(), st});
		}
	};
	add(LONG, 5, 0.55, 0.95);
	add(SHORT, 6, 0.35, 0.85);
	return out;
})();

/* ------------------------------------------------------------------ */
/* 排字                                                                */
/* ------------------------------------------------------------------ */
export type Word = {x: number; w: number; text: string; zone: number; pin: boolean; u: number};
export type Line = {y: number; words: Word[]; fill: boolean; fillAt: number; dir: 1 | -1; core?: boolean};

const layoutLine = (y: number, seed: number, fill: boolean): Word[] => {
	const r = rng(seed);
	const words: Word[] = [];
	const mid = y - (ASC - DESC) / 2;
	let k = Math.floor(r() * SEQ.length);
	for (const [L, R] of spans(mid)) {
		// 左右起點微錯：負的會被外框裁掉（俐落的邊），正的留出參差（毛邊）
		let x = L + (-46 + r() * 130);
		const end = R - (-46 + r() * 130);
		const x0 = x;
		while (true) {
			const it = SEQ[k % SEQ.length];
			const w = wordW(it.text);
			if (x + w > end) break;
			const c: P = {x: x + w / 2, y: mid};
			const inLong = coord(c, LONG);
			const inShort = coord(c, SHORT);
			// 乾筆：落在飛白細帶裡的字不畫（12% 機會留下，帶子才不會太整齊）
			let dry = false;
			for (const d of DRY) {
				const q = d.st === LONG ? inLong : inShort;
				// 補行（小節 21 的「沾墨」）只有一半會被飛白吃掉
				if (q.t >= d.t0 && q.t <= 1.02 && q.s >= d.s0 && q.s <= d.s1 && r() < (fill ? 0.45 : 0.88)) dry = true;
			}
			// 筆刷外緣：越靠邊越容易缺字（毛邊）
			const edge = Math.min(Math.abs(inLong.s) > 1.2 ? 9 : Math.abs(inLong.s), Math.abs(inShort.s) > 1.2 ? 9 : Math.abs(inShort.s));
			if (edge > 0.8 && r() < (edge - 0.8) * 1.6) dry = true;
			let zone = -1;
			for (let zi = 0; zi < ZONES.length; zi++) {
				const z = ZONES[zi];
				if (x + w > z.x0 && x < z.x1 && y + DESC > z.y0 && y - ASC < z.y1) {
					zone = zi;
					if (z.kind === 'clear') break;
				}
			}
			if (!dry) words.push({x, w, text: it.text, zone, pin: false, u: 0});
			x += w + it.gap;
			k++;
		}
		const span = Math.max(1, x - x0);
		for (const w of words) if (w.x >= x0 - 1 && w.x <= x) w.u = clamp((w.x - x0) / span);
	}
	return words;
};

// 小節 21：紋理變密（替拉遠鋪路）。第 1 輪修正：每半拍一組（8 組），拉遠前每拍都有東西在長
const BEATS21 = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => b60(80 + k * 0.5));
const S8_TOP = ANCHOR.S8.y - BOX.halfH - 280;
const S8_SPAN = BOX.halfH * 2 + 560;

export const LINES: Line[] = (() => {
	const r = rng(9031);
	const ys: number[] = [];
	// 飛白行：整段 1–3 行幾乎空掉（只在筆刷一側留 20–34% 的字），拉遠時是乾筆的飛白，
	// 筆刷外形不會被橫向切斷
	const dryRow = new Map<number, {side: 1 | -1; keep: number}>();
	let y = MAP.minY + 40;
	while (y < MAP.maxY - 10) {
		if (r() < 0.07) {
			const n = 1 + Math.floor(r() * 3);
			const side: 1 | -1 = r() < 0.5 ? 1 : -1;
			for (let i = 0; i < n && y < MAP.maxY - 10; i++) {
				ys.push(y);
				dryRow.set(y, {side, keep: 0.2 + 0.14 * r()});
				y += 52 + 20 * r();
			}
			continue;
		}
		ys.push(y);
		y += 40 + 70 * Math.pow(r(), 0.45); // 偏疏一點，小節 21 的補行才有位置
	}
	// 把釘住的詞所在的行對齊過去
	const pinYs = PINS.map((p) => p.y);
	const base = ys.filter((v) => pinYs.every((py) => Math.abs(v - py) >= 44));
	for (const py of pinYs) if (!base.includes(py)) base.push(py);
	base.sort((a, b) => a - b);

	// 補行（小節 21 才出現）：插在比較寬的行距裡，位置不置中，行距因此更不均
	const fills: number[] = [];
	for (let i = 0; i + 1 < base.length; i++) {
		const g = base[i + 1] - base[i];
		if (dryRow.has(base[i]) || dryRow.has(base[i + 1])) continue;
		if (g >= 124 && r() < 0.8) {
			// 很寬的行距補兩行
			const a = base[i] + 40 + r() * (g - 122) * 0.5;
			fills.push(a, a + 41 + r() * Math.max(0, base[i + 1] - 40 - (a + 41)));
		} else if (g >= 80 && r() < 0.9) fills.push(base[i] + 40 + r() * (g - 80));
	}

	const lines: Line[] = [];
	base.forEach((v, i) => {
		let words = layoutLine(v, 7000 + i * 13, false);
		const dr = dryRow.get(v);
		if (dr) words = words.filter((w) => (dr.side === 1 ? w.u <= dr.keep : w.u >= 1 - dr.keep));
		for (const p of PINS) {
			if (p.y !== v) continue;
			const keep = words.filter((w) => w.x + w.w + WORD_GAP <= p.x || w.x >= p.x + wordW(p.text) + WORD_GAP);
			keep.push({x: p.x, w: wordW(p.text), text: p.text, zone: -1, pin: true, u: 0.5});
			keep.sort((a, b) => a.x - b.x);
			words.splice(0, words.length, ...keep);
		}
		lines.push({y: v, words, fill: false, fillAt: 0, dir: 1});
	});
	fills.forEach((v, i) => {
		const words = layoutLine(v, 51000 + i * 17, true);
		// 在站 8 附近的補行：照高度分八組，每半拍一組由上往下補（落在小節 21 的拍點與反拍）
		const inView = v >= S8_TOP && v <= S8_TOP + S8_SPAN;
		const g = inView ? clamp(Math.floor(((v - S8_TOP) / S8_SPAN) * 8), 0, 7) : Math.floor(r() * 8);
		const jitter = Math.floor(r() * 4);
		// 短筆畫（下臂）上的刷向是右 → 左，長筆畫是左 → 右
		const dir: 1 | -1 = v > APEX.y + 300 ? -1 : 1;
		lines.push({y: v, words, fill: true, fillAt: BEATS21[g] - 3 + jitter, dir});
	});
	lines.sort((a, b) => a.y - b.y);

	// 揭曉補墨（第 1 輪修正）：拉遠到字只剩一層色調時，筆刷核心（離中線 0.62 個半寬以內）再補一層字，
	// 只補行距 ≥ 80 的空隙（補完行距 ≤ 55，不會疊字）；飛白只留在外側（毛邊與乾筆細帶），「>」才是一道濃墨筆刷而不是淡灰斜紋。
	// 只在 zoom < 0.62 之後淡進來（Texture.tsx），站點附近停留時完全看不到。
	const core: Line[] = [];
	for (let i = 0; i + 1 < lines.length; i++) {
		const g = lines[i + 1].y - lines[i].y;
		if (g < 80) continue;
		const n = 1;
		for (let k = 1; k <= n; k++) {
			const v = lines[i].y + (g * k) / (n + 1) + (r() - 0.5) * 8;
			const words = layoutLine(v, 88000 + i * 31 + k, true).filter((w) => {
				const c: P = {x: w.x + w.w / 2, y: v - (ASC - DESC) / 2};
				const a = coord(c, LONG);
				const b = coord(c, SHORT);
				const inA = a.t >= -0.02 && a.t <= 1.02 && Math.abs(a.s) < 0.62;
				const inB = b.t >= -0.02 && b.t <= 1.02 && Math.abs(b.s) < 0.62;
				return inA || inB;
			});
			if (words.length) core.push({y: v, words, fill: false, fillAt: 0, dir: 1, core: true});
		}
	}
	lines.push(...core);
	lines.sort((a, b) => a.y - b.y);
	return lines;
})();

/* ------------------------------------------------------------------ */
/* 每格：讓位區的透明度與推開量                                           */
/* ------------------------------------------------------------------ */
export const zoneState = (zi: number, f: number) => {
	if (zi < 0) return {o: 1, push: 0};
	const z = ZONES[zi];
	const p = prog(f, z.at - 2, 12, E.outExpo);
	if (z.kind === 'dim') return {o: 1 - 0.6 * p, push: 0};
	return {o: 1 - p, push: 18 * p};
};

export const TEX_BOUNDS = {x: MAP.minX - 240, y: MAP.minY - 240, w: MAP.w + 480, h: MAP.h + 480};
export const LONG_PATH_PTS = LONG_STROKE;
export const SHORT_PATH_PTS = SHORT_STROKE;
