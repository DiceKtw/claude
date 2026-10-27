// 30 秒〈一格一位〉完整影片（唯讀）
import React from 'react';
import {G30} from './defs';
import {A} from './shots/A';
import {B} from './shots/B';
import {C} from './shots/C';
import {D} from './shots/D';
import {E} from './shots/E';
import {F} from './shots/F';
import {G} from './shots/G';
import {H} from './shots/H';
import {I} from './shots/I';
import {J} from './shots/J';

export const Geese30Video: React.FC = () => <G30 parts={{A, B, C, D, E, F, G, H, I, J}} />;
