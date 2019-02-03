import { Observable, Subject, merge, of } from 'rxjs';
import { scan, first, switchMap } from 'rxjs/operators';
import { State } from './state';

export type Mutation<S> = (state: S) => S;

export interface Store<S> {
  state$: Observable<S>,
  dispatch(operation: Mutation<S>): void,
  setInitialState(initialState: S): void,
  complete(): void,
}

function initializeStore<S>(): Store<S> {
  const operations$ = new Subject<Mutation<S>>();
  const initialState$ = new Subject<S>();
  const state$ = initialState$.pipe(
    first(),
    switchMap(initialState => merge(
      of(initialState),
      operations$.pipe(
        scan<Mutation<S>, S>((previousState, operation) => (
          operation(previousState), initialState)
        ),
      ),
    ))
  );

  return {
    state$,
    dispatch: (operation: Mutation<S>) => operations$.next(operation),
    setInitialState: (initialState: S) => {
      console.log('called initial state', initialState);
      initialState$.next(initialState);
    },
    complete: () => operations$.complete(),
  };
}

export const store = initializeStore<State>();
