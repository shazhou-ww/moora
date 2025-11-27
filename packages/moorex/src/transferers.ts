import { createPubSub } from './pub-sub';
import type { PubSub } from './pub-sub';

export type Dispatch<Input> = (input: Input) => void;

// A procedure is an async process that can dispatch one or more inputs
export type Procedure<Input> = (
  dispatch: Dispatch<Input>
) => void | Promise<void>;

export type OutputHandler<Input, Output> = (output: Output) => Procedure<Input>;

export type Unsubscribe = () => void;

export type Subscribe<Input, Output> = (handler: OutputHandler<Input, Output>) => Unsubscribe;

export type Transferer<Input, Output> = {
  dispatch: Dispatch<Input>;
  subscribe: Subscribe<Input, Output>;
}

export type StatefulTransferer<Input, Output, State> = Transferer<Input, Output> & {
  current: () => State;
}

export type Initial<State> = () => State;

export type Transition<Input, State> = (input: Input) => (state: State) => State;

export type StateMachine<Input, State> = {
  initial: Initial<State>;
  transition: Transition<Input, State>;
};

export type MealyMachine<Input, Output, State> = StateMachine<Input, State> & {
  output: (input: Input) => (state: State) => Output;
};

export type MooreMachine<Input, Output, State> = StateMachine<Input, State> & {
  output: (state: State) => Output;
};

const runHandler = <Input, Output>(
  handler: OutputHandler<Input, Output>,
  dispatch: Dispatch<Input>
) => (output: Output) => {
  const proc = handler(output);
  queueMicrotask(() => proc(dispatch));
};

const subscribeFor = <Input, Output>(pubsub: PubSub<Output>, dispatch: Dispatch<Input>): Subscribe<Input, Output> => {
  return (handler: OutputHandler<Input, Output>) => {
    return pubsub.sub(runHandler(handler, dispatch));
  };
};

export function machine<Input, Output, State>(
  { initial, transition }: StateMachine<Input, State>,
  output: (options: { statePrev: State; signal: Input; state: State }) => Output
): StatefulTransferer<Input, Output, State> {
  let state = initial();
  const pubsub = createPubSub<Output>();
  const dispatch = (input: Input) => {
    const statePrev = state;
    state = transition(input)(state);
    pubsub.pub(output({ statePrev, signal: input, state }));
  };
  const subscribe = subscribeFor(pubsub, dispatch);
  const current = () => state;
  return { dispatch, subscribe, current };
};

export function mealy<Input, Output, State>({
  initial,
  transition,
  output,
}: MealyMachine<Input, Output, State>): StatefulTransferer<Input, Output, State> {
  return machine({
    initial,
    transition,
  }, ({ signal, statePrev }) => output(signal)(statePrev));
};

export function moore<Input, Output, State>({
  initial,
  transition,
  output,
}: MooreMachine<Input, Output, State>): StatefulTransferer<Input, Output, State> {
  const { dispatch, subscribe: sub, current } = machine({
    initial,
    transition,
  }, ({ state }) => output(state));

  const subscribe: Subscribe<Input, Output> = (handler) => {
    const unsub = sub(handler);
    const state = current();
    const out = output(state);
    handler(out);
    return unsub;
  };
  return { dispatch, subscribe, current };
};
