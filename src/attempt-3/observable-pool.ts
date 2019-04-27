import { Observable, OperatorFunction, Subject, of } from 'rxjs';
import { concatMap, mergeMap, finalize, switchMap, exhaustMap, map } from 'rxjs/operators';

export class ObservablePool {
  /**
   * The current count of free resources.
   */
  private resourceCount = this.concurrency;

  /**
   * The list of tasks waiting of free resources. This is currently implemented as an array which
   * could be slow for extremely large queues but works well for small ones.
   */
  private queue: Subject<void>[] = [];

  constructor(public concurrency: number) { }

  /**
   * Returns an observable that will emit and complete when there is an available resource. You
   * must call release when you are finished with the resource to ensure it is returned to the pool.
   */
  acquire(): Observable<void> {
    if (this.resourceCount > 0) {
      this.resourceCount -= 1;
      return of(undefined);
    }

    const subject = new Subject<void>();
    this.queue.push(subject);
    return subject.asObservable();
  }

  /**
   * Releases a resource back to the pool for others to use. There is no checking on how many
   * resources are being released so care should be taken to ensure that each acquire call is
   * matched with exactly one release call.
   */
  release(): void {
    this.resourceCount += 1;
    if (this.queue.length > 0) {
      const next = this.queue.shift() as Subject<void>;
      next.next();
      next.complete();
    }
  }
}

export function runWithPool<R>(
  pool: ObservablePool,
  operation: () => Observable<R>,
): Observable<R> {
  const release = () => pool.release();
  // Request a new resource, perform the operation, and then release the resource.
  return pool.acquire().pipe(mergeMap(() => operation().pipe(finalize(release))));
}

export function flatMapPool<T, O, R = O>(
  pool: ObservablePool,
  transform: (value: T) => Observable<O>,
  flatten: (observable: (value: T) => Observable<O>) => OperatorFunction<T, R>,
): OperatorFunction<T, R> {
  return input => input.pipe(flatten(value => runWithPool(pool, () => transform(value))));
}

export function mapPool<T, R>(
  pool: ObservablePool,
  transform: (value: T) => Observable<R>,
): OperatorFunction<T, Observable<R>> {
  return flatMapPool<T, R, Observable<R>>(pool, transform, map);
}

export function mergeMapPool<T, R>(
  pool: ObservablePool,
  transform: (value: T) => Observable<R>,
): OperatorFunction<T, R> {
  return flatMapPool<T, R>(pool, transform, mergeMap);
}

export function concatMapPool<T, R>(
  pool: ObservablePool,
  transform: (value: T) => Observable<R>,
): OperatorFunction<T, R> {
  return flatMapPool<T, R>(pool, transform, concatMap);
}

export function exhaustMapPool<T, R>(
  pool: ObservablePool,
  transform: (value: T) => Observable<R>,
): OperatorFunction<T, R> {
  return flatMapPool<T, R>(pool, transform, exhaustMap);
}

export function switchMapPool<T, R>(
  pool: ObservablePool,
  transform: (value: T) => Observable<R>,
): OperatorFunction<T, R> {
  return flatMapPool<T, R>(pool, transform, switchMap);
}
