import { isObservable, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';

export type Asynchronous<T> = T | Promise<T> | Observable<T>;

export function toObservable<T>(asynchronous: Asynchronous<T>): Observable<T> {
  if (isObservable(asynchronous)) {
    return asynchronous;
  }

  if (
    asynchronous
      && typeof asynchronous === 'object'
      && typeof (asynchronous as any).then === 'function'
  ) {
    return fromPromise(asynchronous as PromiseLike<T>);
  }

  return of(asynchronous as T);
}
