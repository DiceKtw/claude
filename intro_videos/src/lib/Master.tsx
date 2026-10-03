// 通用總裝（唯讀）：依時間表排場景、套轉場、疊 HUD 和顆粒
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {InWrap, OutWrap, Transition, isOut} from './transitions';

export type SceneProps = {from: number};
export type SceneDef = {
	id: string;
	from: number; // 全域起始格（包含轉場重疊）
	to: number; // 全域結束格（不含）
	C: React.FC<SceneProps>;
	enter: Transition; // 這個場景怎麼進來（In 類或 cut）
	exit: Transition; // 這個場景怎麼離開（Out 類或 cut）
};

export const Master: React.FC<{
	scenes: SceneDef[];
	overlay?: (f: number) => React.ReactNode; // HUD、顆粒等最上層
}> = ({scenes, overlay}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{scenes.map((s, i) => {
				// 舊場景在上面被移走（Out）時，它要比下一個場景高（下一場是 100+(i+1)*2，所以 +3）
				const z = isOut(s.exit) ? 100 + i * 2 + 3 : 100 + i * 2;
				const C = s.C;
				return (
					<Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} style={{zIndex: z}} name={s.id}>
						<OutWrap f={f} tr={s.exit}>
							<InWrap f={f} tr={s.enter}>
								<C from={s.from} />
							</InWrap>
						</OutWrap>
					</Sequence>
				);
			})}
			{overlay ? <AbsoluteFill style={{zIndex: 1000}}>{overlay(f)}</AbsoluteFill> : null}
		</AbsoluteFill>
	);
};

/** 場景內用：取得全域格數 */
export const useG = (from: number) => useCurrentFrame() + from;
