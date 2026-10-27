// 30 秒〈一格一位〉鏡頭 A・開場鉤子（小節 1）
// f0 大鼓：6 個「客」擠在一格裡互推 → 拍 2 五個排 V 字往右上彈出 → 拍 3 剩一個放大、格子填黃 → 拍 4 直排黑框拉門進場
import React from 'react';
import {ShotProps} from '../kit';
import {OpeningStage, PaperFast} from './A_parts';

export const A: React.FC<ShotProps> = ({f}) => (
	<>
		<PaperFast />
		<OpeningStage f={f} />
	</>
);
