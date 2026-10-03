// 安格斯完整影片（唯讀）
import React from 'react';
import {AngusDev} from './defs';
import {S0} from './scenes/S0';
import {S1} from './scenes/S1';
import {S2} from './scenes/S2';
import {S3} from './scenes/S3';
import {S4} from './scenes/S4';
import {S5} from './scenes/S5';
import {S6} from './scenes/S6';

export const AngusVideo: React.FC = () => <AngusDev map={{S0, S1, S2, S3, S4, S5, S6}} />;
