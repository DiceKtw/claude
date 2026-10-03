// 安格斯 S5（佔位，待製作）
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';

export const S5: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);
	return (
		<AbsoluteFill style={{background: ANGUS.ink, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: F.display, fontWeight: 900, fontSize: 120, color: ANGUS.accent}}>S5 安格斯</div>
			<div style={{fontFamily: F.mono, fontSize: 40, color: ANGUS.paper}}>{g}</div>
		</AbsoluteFill>
	);
};
