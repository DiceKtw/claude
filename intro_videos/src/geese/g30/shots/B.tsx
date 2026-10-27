// 30 秒〈一格一位〉鏡頭 B・不會塞好幾位（小節 2）
// 接住開場構圖：V 字小隊在右上角慢慢飛走；拍 2 下方一行附屬句進場
import React from 'react';
import {C30} from '../../copy';
import {Line, ShotProps, bar30} from '../kit';
import {OpeningStage, PaperFast} from './A_parts';

const AT = bar30(2, 2); // 141

export const B: React.FC<ShotProps> = ({f}) => (
	<>
		<PaperFast />
		<OpeningStage f={f}>
			<Line x={90} y={1150} text={C30.B.line} size={48} weight={500} f={f} at={AT - 2} />
		</OpeningStage>
	</>
);
