// 30 秒〈一格一位〉鏡頭 B・不會塞好幾位（小節 2）
// 接住開場構圖：V 字小隊在右上角慢慢飛走；正拍下方一行附屬句進場（句子畫在共用舞台裡，A 的最後兩格就開始升起）；
// 拍 1、3、4 框裡的直排字被大鼓震一下，格子與框反向等速微漂到硬切
import React from 'react';
import {ShotProps} from '../kit';
import {OpeningStage, PaperFast} from './A_parts';

export const B: React.FC<ShotProps> = ({f}) => (
	<>
		<PaperFast />
		<OpeningStage f={f} />
	</>
);
