// 60 秒〈字的雁陣〉鏡頭（唯讀）：一鏡到底，沿「>」走 8 站，最後拉遠揭曉整張字地圖。
// camera(f) 回傳「閱讀窗中心 (485, 759) 對準的世界座標」和縮放。
import {E, clamp, lerp, prog} from '../../lib/motion';
import {READ, b60} from '../theme';
import {ANCHOR, MAP, REVEAL_ZOOM, P} from './world';
import {ST, STATIONS} from './timeline';

export type Cam = {x: number; y: number; zoom: number};

const HALF_BEAT = 16; // 站與站之間移鏡：前後各半拍，共 1 拍 inOutExpo
const START_OFFSET: P = {x: -170, y: -240}; // 第 0 格鏡頭就在動：從站 1 左上方滑進來

// 停留時沿筆畫方向慢漂（每站約 60px），加 1.2% 慢推
const drift = (id: string, f: number, from: number, to: number): {dx: number; dy: number; dz: number} => {
	const lower = ['S6', 'S7', 'S8'].includes(id);
	const p = prog(f, from, to - from, E.inOutSine);
	return {dx: (lower ? -1 : 1) * 42 * p, dy: 60 * p, dz: 0.012 * p};
};

const stationPose = (id: string, f: number): Cam => {
	const a = ANCHOR[id];
	const st = ST[id as keyof typeof ST];
	const d = drift(id, f, st.from + HALF_BEAT, st.to - HALF_BEAT);
	return {x: a.x + d.dx, y: a.y + d.dy, zoom: 1 + d.dz};
};

export const camera = (f: number): Cam => {
	// 開場：第 0 格就在動，第 2 拍（≈ f32）抵達站 1
	if (f < b60(1)) {
		const p = prog(f, 0, b60(1), E.outExpo);
		const a = ANCHOR.S1;
		return {x: a.x + START_OFFSET.x * (1 - p), y: a.y + START_OFFSET.y * (1 - p), zoom: 1};
	}
	// 拉遠揭曉 → logo → 片尾
	if (f >= ST.REVEAL.from - HALF_BEAT) {
		const from = stationPose('S8', ST.REVEAL.from - HALF_BEAT);
		const p = prog(f, ST.REVEAL.from - HALF_BEAT, ST.REVEAL.to - ST.REVEAL.from + HALF_BEAT, E.inOutExpo);
		// 縮放用對數內插，速度感比較均勻
		const z = Math.exp(lerp(Math.log(from.zoom), Math.log(REVEAL_ZOOM), p));
		// 拉遠的中心：揭曉後地圖中心要在畫面正中央 (540, 960)，換算成閱讀窗中心對準的點
		const cxTarget = MAP.cx + (READ.cx - 540) / REVEAL_ZOOM;
		const cyTarget = MAP.cy + (READ.cy - 960) / REVEAL_ZOOM;
		let x = lerp(from.x, cxTarget, p);
		let y = lerp(from.y, cyTarget, p);
		let zoom = z;
		// logo 時刻與片尾：整張慢推 1.5%
		if (f >= ST.LOGO.from) zoom = REVEAL_ZOOM * (1 + 0.015 * prog(f, ST.LOGO.from, 3600 - ST.LOGO.from, E.inOutSine));
		return {x, y, zoom};
	}
	// 站與站之間：在下一站開始的前後半拍移鏡
	for (let i = 1; i < STATIONS.length; i++) {
		const id = STATIONS[i];
		const prev = STATIONS[i - 1];
		const t0 = ST[id].from - HALF_BEAT;
		const t1 = ST[id].from + HALF_BEAT;
		if (f >= t0 && f < t1) {
			const A = stationPose(prev, t0);
			const B = stationPose(id, t1);
			const p = prog(f, t0, t1 - t0, E.inOutExpo);
			return {x: lerp(A.x, B.x, p), y: lerp(A.y, B.y, p), zoom: lerp(A.zoom, B.zoom, p)};
		}
	}
	// 停在某一站
	for (let i = STATIONS.length - 1; i >= 0; i--) {
		const id = STATIONS[i];
		if (f >= ST[id].from) return stationPose(id, f);
	}
	return {x: ANCHOR.S1.x, y: ANCHOR.S1.y, zoom: 1};
};

/** 世界座標 → 畫面座標 */
export const toScreen = (p: P, cam: Cam): P => ({x: READ.cx + (p.x - cam.x) * cam.zoom, y: READ.cy + (p.y - cam.y) * cam.zoom});

/** 鏡頭移動速度（每格位移，畫面像素），給動態模糊用 */
export const camVelocity = (f: number) => {
	const a = camera(f - 0.5);
	const b = camera(f + 0.5);
	return {vx: (b.x - a.x) * b.zoom, vy: (b.y - a.y) * b.zoom};
};

/** 站點是否在畫面附近（不在就不畫，省效能）；拉遠之後全部都要畫 */
export const nearCamera = (p: P, cam: Cam, margin = 1400) => {
	const s = toScreen(p, cam);
	return s.x > -margin && s.x < 1080 + margin && s.y > -margin && s.y < 1920 + margin;
};

export const clampZoom = (z: number) => clamp(z, 0.05, 4);
