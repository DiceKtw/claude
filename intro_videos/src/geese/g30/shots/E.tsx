// 30 秒〈一格一位〉鏡頭 E・燙・染（小節 5–6）
// 每拍硬切一次。小節 5：超大裁切字四連擊（燙往下砸／染往上頂／兩字左右撞到中線／墨底反白燙放大收回）；
// 小節 6：紙底一句兩行大字「燙、染，／全程設計師操作。」——拍 1 第一行、拍 2 第二行落位（第二行從下面頂上來，把第一行頂一下）；
// 拍 3、拍 4 右下角的「設計師」小框分兩段跳到句子裡「設計師」三字的正下方：這個框＝句子裡的設計師（F 從那裡接手）。
// 「設計師」小框在小節 5 四連擊之間釘在右下角不動。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DirBlur} from '../../../lib/components';
import {E as EZ, clamp, lerp} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {ShotProps, b30} from '../kit';
import {PaperFast, ring} from './A_parts';
import {DesignerTag, Giant, TAG, TAG_E6} from './E_parts';

const BEATS = Array.from({length: 8}, (_, k) => b30(16 + k)); // 450 478 506 534 563 591 619 647
const SIZE = 1420; // 字高約 1300px
const CX = 540;
const CY = 790;

/** 撞擊：拍點那格壓到最扁（amt），之後衰減彈回、略過衝，一路微微晃到下一拍（不死） */
const impact = (f: number, b: number, amt: number) => {
	const t = f - b;
	if (t < 0) return 0;
	return amt * Math.cos(0.42 * t) * Math.exp(-t / 9);
};
const vel = (fn: (ff: number) => number, f: number) => fn(f + 0.5) - fn(f - 0.5);

// 小節 6：一句兩行大字（96px、900；8 字×96＝768px，在閱讀窗 90–880 內）
const L_SIZE = 96;
const L_LH = 112;
const L_X = 90;
const L_Y = [560, 680];
const LINES = C30.E.line.replace('，', '，\n').split('\n'); // 燙、染，／全程設計師操作。
// 「設計師」小框：拍 3 跳到半路、拍 4 落在第二行「設計師」三字（x 282–570）的正下方
const HOP_MID = {x: (TAG.x + TAG_E6.x) / 2, y: (TAG.y + TAG_E6.y) / 2 + 30};
const HOP_LIFT = [70, 28]; // 第二段落點就在第二行正下方：拱得低，不從字上面掃過去
/** 小節 6 整組（兩行字＋小框的落點）每格等速往上 1px（整數像素，不會固定幾格停一下）；
 *  版面以 f675 的位置設計，越早越低：硬切到 F 那一格，小框剛好在 TAG_E6，接得上。 */
const E6_END = 675;
const rise6 = (f: number) => Math.max(0, E6_END - f);

/** 一行大字：拍前 3 格起跑，從下方 70px 升上來（outExpo 12 格，最快那格在拍上） */
const lineOff = (f: number, b: number) => 70 * (1 - EZ.outExpo(clamp((f - (b - 3)) / 12)));

/** 小框的位置（上緣）：兩段跳，每段 outExpo 10 格、拍前 2 格起跑，路徑往上拱（跳起來） */
const hopAt = (f: number, b3: number, b4: number) => {
	const p1 = EZ.outExpo(clamp((f - (b3 - 2)) / 10));
	const p2 = EZ.outExpo(clamp((f - (b4 - 2)) / 10));
	const r = rise6(f);
	const a = {x: lerp(TAG.x, HOP_MID.x, p1), y: lerp(TAG.y, HOP_MID.y + r, p1)};
	return {
		x: lerp(a.x, TAG_E6.x, p2),
		y: lerp(a.y, TAG_E6.y + r, p2) - HOP_LIFT[0] * Math.sin(Math.PI * p1) * (1 - p2) - HOP_LIFT[1] * Math.sin(Math.PI * p2),
	};
};

export const E: React.FC<ShotProps> = ({f}) => {
	let k = 0;
	for (let i = 0; i < BEATS.length; i++) if (f >= BEATS[i]) k = i;
	const b = BEATS[k];

	let body: React.ReactNode = null;
	if (k === 0) {
		// 燙：從上方砸下來，拍點那格撞地壓扁（以字底為受力點），再彈回
		const q = impact(f, b, 0.035);
		body = <Giant ch={C30.E.a} cx={CX} cy={CY} size={SIZE} sx={1 + q * 0.45} sy={1 - q} origin="50% 92%" />;
	} else if (k === 1) {
		// 染：從下面頂上來（outBack 過衝再回），越快拉得越長（以字頂為受力點）
		// 落定後繼續等速往上頂（每格 1px：整數像素，不會固定幾格出現一格重複畫面）：不在下一拍前停住
		const y = (ff: number) => 190 * (1 - EZ.outBack(clamp((ff - (b - 3)) / 16))) - 1.0 * Math.max(0, ff - (b - 3));
		const st = clamp(Math.abs(vel(y, f)) / 320, 0, 0.045);
		body = <Giant ch={C30.E.b} cx={CX} cy={CY + y(f)} size={SIZE} sx={1 - st * 0.4} sy={1 + st} origin="50% 8%" />;
	} else if (k === 2) {
		// 兩字各佔半邊：左右各自撞上中線（染晚 2 格），撞的那格橫向壓扁，中間一道墨線把它們隔成兩格
		const half = 1150;
		const ql = impact(f, b, 0.03);
		const qr = impact(f, b + 2, 0.03);
		// 染還沒撞到之前：加速衝向中線
		const xr = f < b + 2 ? 70 * Math.pow((b + 2 - f) / 3, 2) : 0;
		body = (
			<>
				<Giant ch={C30.E.a} cx={270} cy={CY} size={half} sx={1 - ql} sy={1 + ql * 0.45} origin="96% 50%" clip={{x: 0, y: 0, w: 535, h: 1920}} />
				<Giant ch={C30.E.b} cx={810 + xr} cy={CY} size={half} sx={1 - qr} sy={1 + qr * 0.45} origin="4% 50%" clip={{x: 545, y: 0, w: 535, h: 1920}} />
				<div style={{position: 'absolute', left: 535, top: 0, width: 10, height: 1920, background: G.ink}} />
			</>
		);
	} else if (k === 3) {
		// 全片唯一一次墨底大字：反白燙，拍點那格最大（1.2 倍），往回收（outExpo）再慢慢收一點
		const s = 1 + 0.2 * (1 - EZ.outExpo(clamp((f - b) / 14))) - 0.015 * EZ.inOutSine(clamp((f - b) / 28));
		body = (
			<>
				<AbsoluteFill style={{background: G.ink}} />
				<Giant ch={C30.E.a} cx={CX} cy={CY} size={SIZE} color={G.paper} sx={s} sy={s} />
			</>
		);
	} else {
		// 小節 6：一句兩行大字
		const b1 = BEATS[4];
		const b2 = BEATS[5];
		// 第二行從下面頂上來時，把第一行往上頂一下；小框落在第二行底下時，第二行也被頂一下
		const nudge1 = -8 * ring(f - b2, 0.42, 6);
		const nudge2 = -6 * ring(f - BEATS[7], 0.42, 6);
		const ys = [L_Y[0] + lineOff(f, b1) + nudge1 + rise6(f), L_Y[1] + lineOff(f, b2) + nudge2 + rise6(f)];
		body = (
			<>
				<PaperFast />
				{LINES.map((t, r) => {
					const b = r === 0 ? b1 : b2;
					if (f < b - 3) return null;
					const v = Math.abs(vel((ff) => lineOff(ff, b), f));
					return (
						<DirBlur key={r} y={Math.min(10, v * 0.18)} style={{position: 'absolute', left: L_X, top: ys[r], width: 800, height: L_LH}}>
							<div lang="zh-Hant-TW" style={{fontFamily: F.round, fontWeight: 900, fontSize: L_SIZE, lineHeight: `${L_LH}px`, color: G.ink, whiteSpace: 'pre'}}>
								{t}
							</div>
						</DirBlur>
					);
				})}
			</>
		);
	}

	// 「設計師」小框：小節 5 釘在右下角；小節 6 拍 3、4 跳到句子裡的「設計師」底下，落地時框裡的字多沉一下
	const b3 = BEATS[6];
	const b4 = BEATS[7];
	const tp = hopAt(f, b3, b4);
	const tvx = hopAt(f + 0.5, b3, b4).x - hopAt(f - 0.5, b3, b4).x;
	const tvy = hopAt(f + 0.5, b3, b4).y - hopAt(f - 0.5, b3, b4).y;
	const tagLag = 12 * ring(f - (b3 + 6), 0.4, 6) + 14 * ring(f - (b4 + 6), 0.4, 6);

	return (
		<>
			{k < 3 ? <PaperFast /> : null}
			{body}
			<DesignerTag x={tp.x} y={tp.y} lag={tagLag} blur={{x: Math.min(12, Math.abs(tvx) * 0.2), y: Math.min(12, Math.abs(tvy) * 0.2)}} />
		</>
	);
};
