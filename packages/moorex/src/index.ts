// 重新导出类型，保持向后兼容
export type {
  MoorexDefinition,
  MoorexEvent,
  Moorex,
  CancelFn,
  EffectInitializer,
} from './types';

// 导出新的类型
export type {
  AutomataDefinition,
  Automata,
  EffectsAt,
  RunEffect,
  EffectController,
  EffectControllerStatus,
  EffectEvent,
} from './types';

// 导出 pubsub
export type { PubSub } from './pub-sub';
export { createPubSub } from './pub-sub';
export { createMoorex } from './moorex';