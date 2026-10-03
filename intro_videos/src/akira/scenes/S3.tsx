// Akira S3（佔位，待製作）
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';

export const S3: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);
	return (
		<AbsoluteFill style={{background: AKIRA.ink, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 120, color: AKIRA.accent}}>S3 Akira 川沙龍</div>
			<div style={{fontFamily: F.mono, fontSize: 40, color: AKIRA.paper}}>{g}</div>
		</AbsoluteFill>
	);
};
