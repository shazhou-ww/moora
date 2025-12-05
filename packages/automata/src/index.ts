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
  Procedure,
  OutputHandler,
  Subscribe,
  Transferer,
  StatefulTransferer,
  InitialFn as Initial,
  TransitionFn as Transition,
  Automata,
  MealyOutputFn,
  MooreOutputFn,
  MealyMachine,
  MooreMachine,
  UpdatePack,
} from './types';

// ============================================================================
// 导出函数
// ============================================================================
export { createPubSub } from './pub-sub';
export {
  machine,
  mealy,
  moore,
} from './automata';
