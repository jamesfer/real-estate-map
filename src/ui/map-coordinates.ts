import { Observable, Operator, Subject } from 'rxjs';
import { CoordinateArea } from '../shared/models/coordinates';

export interface MapPosition {
  area: CoordinateArea,
  zoom: number,
}

export class MapPositionObservable extends Observable<MapPosition> {
  private subject = new Subject<MapPosition>();

  /**
   * Override the lift function to get subscribers to subscribe to the subject.
   */
  lift<R>(operator: Operator<MapPosition, R>): Observable<R> {
    const observable = new Observable<R>();
    observable.source = this.subject;
    observable.operator = operator;
    return observable;
  }

  update(position: MapPosition) {
    this.subject.next(position);
  }
}
