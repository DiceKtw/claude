// Akira 時間表（全域格數，60fps，1 拍 30 格）。場景檔照這裡的常數對位，不要自己改。
import type {Transition} from '../lib/transitions';
import {AKIRA} from '../lib/theme';

export const T = {
	S0: {from: 0, to: 240},
	S1: {from: 216, to: 600},
	S2: {from: 576, to: 960},
	S3: {from: 936, to: 1200},
	S4: {from: 1176, to: 1440},
	S5: {from: 1416, to: 1800},
} as const;

export const TR: Record<string, Transition> = {
	wipeDownS1: {type: 'lineWipe', t0: 216, t1: 240, dir: 'down', color: AKIRA.accent},
	liftS1: {type: 'lift', t0: 576, t1: 600},
	wipeRightS3: {type: 'lineWipe', t0: 936, t1: 960, dir: 'right', color: AKIRA.accent},
	dissolveS4: {type: 'dissolve', t0: 1176, t1: 1200},
	dissolveS5: {type: 'dissolve', t0: 1416, t1: 1440},
	cut: {type: 'cut'},
};
