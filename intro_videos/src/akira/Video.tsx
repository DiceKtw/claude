// Akira完整影片（唯讀）
import React from 'react';
import {AkiraDev} from './defs';
import {S0} from './scenes/S0';
import {S1} from './scenes/S1';
import {S2} from './scenes/S2';
import {S3} from './scenes/S3';
import {S4} from './scenes/S4';
import {S5} from './scenes/S5';

export const AkiraVideo: React.FC = () => <AkiraDev map={{S0, S1, S2, S3, S4, S5}} />;
