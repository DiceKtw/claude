// 60 秒〈字的雁陣〉完整影片（唯讀）
import React from 'react';
import {G60} from './defs';
import {Texture} from './stations/Texture';
import {S1} from './stations/S1';
import {S2} from './stations/S2';
import {S3} from './stations/S3';
import {S4} from './stations/S4';
import {S5} from './stations/S5';
import {S6} from './stations/S6';
import {S7} from './stations/S7';
import {S8} from './stations/S8';
import {Overlay} from './stations/Overlay';

export const Geese60Video: React.FC = () => <G60 parts={{Texture, S1, S2, S3, S4, S5, S6, S7, S8, Overlay}} />;
