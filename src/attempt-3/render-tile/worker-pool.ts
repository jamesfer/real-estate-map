export interface WorkerPoolOptions {
  count: number;
  onWorkerCreated(worker: Worker): void;
}

export interface WorkerConstructor {
  new (): Worker;
}

export class WorkerPool {
  private count: number;

  private onWorkerCreated: (worker: Worker) => void;

  private lockedPool: Worker[] = [];

  private freePool: Worker[] = [];

  private queue: ((worker: Worker) => void)[] = [];

  constructor(
    private worker: string | WorkerConstructor,
    poolOptions: WorkerPoolOptions,
    private workerOptions?: WorkerOptions,
  ) {
    this.count = poolOptions.count;
    this.onWorkerCreated = poolOptions.onWorkerCreated;
  }

  /**
   * Picks the next available worker from the pool and locks it. You must manually release it back
   * to the pool once it has finished work.
   */
  acquire(): Promise<Worker> {
    if (this.freePool.length > 0) {
      const worker = this.freePool.shift() as Worker;
      this.lockedPool.push(worker);
      return Promise.resolve(worker);
    }

    if (this.lockedPool.length < this.count) {
      const worker = this.createWorker();
      this.lockedPool.push(worker);
      return Promise.resolve(worker);
    }

    return new Promise((resolve) => this.enqueue(resolve));
  }

  /**
   * Indicates that the given worker is available for work again.
   */
  release(worker: Worker) {
    if (this.lockedPool.includes(worker)) {
      if (this.queue.length > 0) {
        const callback = this.queue.shift() as (worker: Worker) => void;
        setTimeout(() => callback(worker), 0);
      }

      this.freePool.push(worker);
    }
  }

  /**
   * Terminates all workers at once and removes them from the pool.
   */
  // terminateAll() {
  //
  // }

  private createWorker(): Worker {
    const worker = typeof this.worker === 'string'
      ? new Worker(this.worker, this.workerOptions)
      : new this.worker;
    this.onWorkerCreated(worker);
    return worker;
  }

  private enqueue(callback: (worker: Worker) => void) {
    this.queue.push(callback);
  }
}

