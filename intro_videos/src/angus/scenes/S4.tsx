// 安格斯 S4（佔位，待製作）
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';

export const S4: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);
	return (
		<AbsoluteFill style={{background: ANGUS.ink, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: F.display, fontWeight: 900, fontSize: 120, color: ANGUS.accent}}>S4 安格斯</div>
			<div style={{fontFamily: F.mono, fontSize: 40, color: ANGUS.paper}}>{g}</div>
		</AbsoluteFill>
	);
};
