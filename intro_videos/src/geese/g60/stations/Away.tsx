// 60 秒〈字的雁陣〉整合：離站收字（給 S3、S4、S5、S7 用）
// 這幾站的最後幾行放在站框下緣，鏡頭到了下一站之後，會在畫面上緣（閱讀窗外、Reels 介面區）
// 留下被畫框切掉的半截字（例如 S5 停留 6 秒時左上角一直掛著半個「食櫃」）。
// 做法：鏡頭移往下一站那一拍最快、最糊的 8 格內把這站的字收掉；
// 拉遠揭曉時跟紋理轉墨同一格（REVEAL.from−2 起 8 格、outExpo）再回到地圖上，八站的字一起拼成「>」。
import React from 'react';
import {E, prog} from '../../../lib/motion';
import {ST} from '../timeline';

type Next = 'S4' | 'S5' | 'S6' | 'S8';

export const awayOpacity = (f: number, next: Next) => {
	const out = prog(f, ST[next].from - 4, 8, E.inOutSine);
	const back = prog(f, ST.REVEAL.from - 2, 8, E.outExpo);
	return 1 - out * (1 - back);
};

/** 站內所有字包一層：站框大小、站內座標不變；透明度 0 時整站不畫（也省算圖） */
export const Away: React.FC<{f: number; next: Next; children: React.ReactNode}> = ({f, next, children}) => {
	const o = awayOpacity(f, next);
	if (o <= 0.002) return null;
	return <div style={{position: 'absolute', left: 0, top: 0, width: 790, height: 978, opacity: o >= 0.998 ? undefined : Number(o.toFixed(3))}}>{children}</div>;
};
