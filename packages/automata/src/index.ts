/**
 * @moora/automata
 *
 * Automata 是一个通用的自动机库，用于构建状态机（Mealy 机和 Moore 机）。
 *
 * @packageDocumentation
 */

// ============================================================================
// 导出所有类型
// ============================================================================
export type {
  // 基础类型
  CancelFn,
  Unsubscribe,
  // PubSub 相关
  PubSub,
  // 自动机相关
  Dispatch,
  Effect,
  OutputHandler,
  Subscribe,
  Transferer,
  StatefulTransferer,
  InitialFn,
  TransitionFn,
  MealyOutputFn,
  MooreOutputFn,
  StateMachine,
  MealyMachine,
  MooreMachine,
  UpdatePack,
} from './types';

// Effect 相关函数
export { runEffect, parallel } from './effect';

// ============================================================================
// 导出函数
// ============================================================================
export { createPubSub } from './pub-sub';
export {
  automata,
  mealy,
  moore,
} from './automata';
