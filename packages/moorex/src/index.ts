// 重新导出类型，保持向后兼容
export type {
  MoorexDefinition,
  MoorexEvent,
  Moorex,
  CancelFn,
  EffectInitializer,
} from './types';

// 导出主要函数
export { createMoorex } from './create-moorex';
