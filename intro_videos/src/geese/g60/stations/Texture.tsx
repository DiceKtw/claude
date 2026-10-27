// 60 秒〈字的雁陣〉Texture・工作語言紋理字（世界圖層，全片）
// 兩道筆刷（長筆畫＼、短筆畫／）裡填滿 34px 深黃紋理字，用 <clipPath> 裁在筆刷外框裡。
// f0–40   開場：紋理沿長筆畫方向刷進來（整層位移 160px＋一道由左上往右下的淡入波）
// 站點    主字進場那一刻，周圍 40px 的紋理字被推開、淡掉（附屬句後面降到 40%）
// 小節 21 補行一拍一組由上往下補進來（四個拍點），紋理變密、行距更不均，替拉遠鋪路
// f2700   拉遠揭曉：紋理由深黃轉墨（8 格內），整張地圖第一次看起來是兩道墨色筆刷
// （logo 時刻降到 12% 由 Overlay 疊雁黃色塊處理）
import React from 'react';
import {E, clamp, mixHex, prog} from '../../../lib/motion';
import {F, G, READ} from '../../theme';
import {StationProps} from '../kit';
import {ST} from '../timeline';
import {polyPath} from '../world';
import {LINES, LONG_DIR, LONG_PATH_PTS, SHORT_PATH_PTS, TEX, TEX_BOUNDS, ZONES, zoneState} from './Texture_parts';

const CLIP_ID = 'geese60-texture-clip';
const LONG_D = polyPath(LONG_PATH_PTS);
const SHORT_D = polyPath(SHORT_PATH_PTS);
const INTRO = 40;
const SHIFT = 160;

/** 主字落地時，讓位區裡的紋理字往左右兩邊推開（離區塊中心遠的那一側） */
const pushDir = (zi: number, x: number) => (x < ZONES[zi].cx ? -1 : 1);

export const Texture: React.FC<StationProps> = ({f, cam}) => {
	// 畫面看得到的世界範圍（多留一點邊，開場位移與推開量不會露餡）
	const z = cam.zoom;
	const pad = 220 / z;
	const vx0 = cam.x - READ.cx / z - pad;
	const vx1 = cam.x + (1080 - READ.cx) / z + pad;
	const vy0 = cam.y - READ.cy / z - pad;
	const vy1 = cam.y + (1920 - READ.cy) / z + pad;

	// 開場：整層沿長筆畫方向刷進來
	const pIn = prog(f, 0, INTRO, E.outExpo);
	const ox = -SHIFT * LONG_DIR.x * (1 - pIn);
	const oy = -SHIFT * LONG_DIR.y * (1 - pIn);
	const intro = f < INTRO + 24;

	// 拉遠揭曉：深黃 → 墨（8 格內）
	const inkT = prog(f, ST.REVEAL.from - 2, 8, E.outExpo);
	const color = inkT <= 0 ? G.yellowDeep : inkT >= 1 ? G.ink : mixHex(G.yellowDeep, G.ink, inkT);
	const fillOn = f >= LINES.reduce((m, l) => (l.fill ? Math.min(m, l.fillAt) : m), Infinity) - 2;

	const rows: React.ReactNode[] = [];
	for (let li = 0; li < LINES.length; li++) {
		const line = LINES[li];
		if (line.y < vy0 || line.y > vy1) continue;
		if (line.fill && !fillOn) continue;
		// 開場淡入波：由左上往右下（沿筆畫）刷過去
		const lineDelay = clamp((line.y - (cam.y - 900)) / 1900) * 14 - 10;
		const spans: React.ReactNode[] = [];
		for (let wi = 0; wi < line.words.length; wi++) {
			const w = line.words[wi];
			if (w.x + w.w < vx0 || w.x > vx1) continue;
			let o = 1;
			let dx = 0;
			if (intro) o *= prog(f, lineDelay + w.u * 9, 22, E.outExpo);
			if (line.fill) {
				// 補行：沿刷向一字一字補進來（下臂由右往左）
				const u = line.dir === 1 ? w.u : 1 - w.u;
				const q = prog(f, line.fillAt + u * 8, 12, E.outExpo);
				o *= q;
				dx += -line.dir * 16 * (1 - q);
			}
			if (w.zone >= 0) {
				const s = zoneState(w.zone, f);
				o *= s.o;
				if (s.push > 0) dx += s.push * pushDir(w.zone, w.x + w.w / 2);
			}
			if (o <= 0.01) continue;
			spans.push(
				<tspan key={wi} x={(w.x + dx).toFixed(1)} fillOpacity={o >= 0.995 ? undefined : o.toFixed(3)}>
					{w.text}
				</tspan>,
			);
		}
		if (spans.length) {
			rows.push(
				<text key={li} y={line.y.toFixed(1)}>
					{spans}
				</text>,
			);
		}
	}

	const B = TEX_BOUNDS;
	return (
		<svg
			lang="zh-Hant-TW"
			width={B.w}
			height={B.h}
			viewBox={`${B.x} ${B.y} ${B.w} ${B.h}`}
			style={{position: 'absolute', left: B.x, top: B.y, overflow: 'visible', pointerEvents: 'none'}}
		>
			<defs>
				<clipPath id={CLIP_ID} clipPathUnits="userSpaceOnUse">
					<path d={LONG_D} />
					<path d={SHORT_D} />
				</clipPath>
			</defs>
			<g clipPath={`url(#${CLIP_ID})`}>
				<g transform={ox || oy ? `translate(${ox.toFixed(2)} ${oy.toFixed(2)})` : undefined} fill={color} fontFamily={F.round} fontWeight={TEX.weight} fontSize={TEX.size}>
					{rows}
				</g>
			</g>
		</svg>
	);
};
