// 安格斯時間表（全域格數，60fps，1 拍 30 格）。場景檔照這裡的常數對位，不要自己改。
import type {Transition} from '../lib/transitions';

// S0 球的位置（S1 的 iris 從這裡張開）
export const BALL = {x: 330, ground: 1120, r: 24} as const;
// S2 手機外框與螢幕（S3 從螢幕這個框放大填滿）
export const PHONE = {x: 110, y: 400, w: 380, h: 700, r: 52} as const;
export const SCREEN = {x: 124, y: 414, w: 352, h: 672, r: 40} as const;

export const T = {
	S0: {from: 0, to: 240},
	S1: {from: 228, to: 600},
	S2: {from: 584, to: 840},
	S3: {from: 824, to: 1080},
	S4: {from: 1064, to: 1320},
	S5: {from: 1320, to: 1440},
	S6: {from: 1440, to: 1800},
} as const;

export const TR: Record<string, Transition> = {
	irisS1: {type: 'iris', t0: 228, t1: 240, cx: BALL.x, cy: BALL.ground - BALL.r},
	blindsS1: {type: 'blinds', t0: 584, t1: 600, n: 6},
	fillS3: {type: 'fill', t0: 824, t1: 840, ...SCREEN},
	slideS3: {type: 'slide', t0: 1064, t1: 1080},
	cut: {type: 'cut'},
};

// 蒙太奇 8 刀（每刀 15 格）的底色
export const MONTAGE_BG = ['ink', 'accent', 'paper', 'ink', 'accent', 'paper', 'ink', 'accent'] as const;
