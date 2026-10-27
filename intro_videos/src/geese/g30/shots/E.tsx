// 30 秒〈一格一位〉鏡頭 E・燙・染（小節 5–6）
// 每拍硬切一次。小節 5：超大裁切字四連擊（燙往下砸／染往上頂／兩字左右撞到中線／墨底反白燙放大收回）；
// 小節 6：紙底一列「燙、染，全程設計師操作。」，後三拍每拍從上一列複製一列往下滑、越下面越淡。
// 右下角「設計師」小框從頭到尾釘在同一個位置。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E as EZ, clamp, lerp, prog} from '../../../lib/motion';
import {C30} from '../../copy';
import {G} from '../../theme';
import {ShotProps, b30} from '../kit';
import {PaperFast} from './A_parts';
import {DesignerTag, Giant, Row} from './E_parts';

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

// 列：起始位置、間距、墨色深淺
const ROW_X = 90;
const ROW_Y0 = 556;
const ROW_GAP = 92;
const ROW_A = [1, 0.6, 0.3, 0.15];

export const E: React.FC<ShotProps> = ({f}) => {
	let k = 0;
	for (let i = 0; i < BEATS.length; i++) if (f >= BEATS[i]) k = i;
	const b = BEATS[k];

	let body: React.ReactNode = null;
	if (k === 0) {
		// 燙：從上方砸下來，拍點那格撞地壓扁（以字底為受力點），再彈回
		const q = impact(f, b, 0.07);
		body = <Giant ch={C30.E.a} cx={CX} cy={CY} size={SIZE} sx={1 + q * 0.45} sy={1 - q} origin="50% 92%" />;
	} else if (k === 1) {
		// 染：從下面頂上來（outBack 過衝再回），越快拉得越長（以字頂為受力點）
		// 落定後繼續等速往上頂（每格 0.8px）：不在下一拍前停住
		const y = (ff: number) => 190 * (1 - EZ.outBack(clamp((ff - (b - 3)) / 16))) - 0.8 * Math.max(0, ff - (b - 3));
		const st = clamp(Math.abs(vel(y, f)) / 320, 0, 0.09);
		body = <Giant ch={C30.E.b} cx={CX} cy={CY + y(f)} size={SIZE} sx={1 - st * 0.4} sy={1 + st} origin="50% 8%" />;
	} else if (k === 2) {
		// 兩字各佔半邊：左右各自撞上中線（染晚 2 格），撞的那格橫向壓扁，中間一道墨線把它們隔成兩格
		const half = 1150;
		const ql = impact(f, b, 0.06);
		const qr = impact(f, b + 2, 0.06);
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
		// 小節 6：價目表的列
		const b0 = BEATS[4];
		const rise = (1 - prog(f, b0 - 3, 14, EZ.outExpo)) * 70; // 第一列硬切那格還在往上落位
		// 整疊等速往上漂（每格 0.9px）：文字的垂直位置會吸附整數像素，漂得太慢會變成「停 10 格、跳 1px」
		const up = 0.9 * Math.max(0, f - b0);
		const rows: React.ReactNode[] = [];
		for (let r = 0; r < 4; r++) {
			if (r === 0) {
				rows.push(<Row key={r} x={ROW_X} y={ROW_Y0 + rise - up} a={ROW_A[0]} blurY={rise * 0.12} />);
				continue;
			}
			const at = BEATS[4 + r];
			if (f < at - 3) continue;
			// 從上一列的位置「複製」出來，往下滑一列，同時變淡
			const p = (ff: number) => EZ.outExpo(clamp((ff - (at - 3)) / 14));
			const y = (ff: number) => ROW_Y0 + ROW_GAP * (r - 1 + p(ff));
			const a = lerp(ROW_A[r - 1], ROW_A[r], p(f));
			rows.push(<Row key={r} x={ROW_X} y={y(f) - up} a={a} blurY={Math.abs(vel(y, f)) * 0.18} />);
		}
		body = (
			<>
				<PaperFast />
				{rows.reverse()}
			</>
		);
	}

	return (
		<>
			{k < 3 ? <PaperFast /> : null}
			{body}
			<DesignerTag />
		</>
	);
};
