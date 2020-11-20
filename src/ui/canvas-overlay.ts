import { Orchestrator } from './orchestrator';

// TODO convert all visible tiles functions to use bounds instead of coordinate area

export class CanvasOverlay extends google.maps.OverlayView {
  /**
   * The wrapper div element that will contain the entire overlay.
   */
  private readonly wrapper: HTMLElement;

  /**
   * The orchestrator is responsible for creating and removing tiles and layers.
   */
  private readonly orchestrator: Orchestrator;

  constructor(map: google.maps.Map, orchestrator: Orchestrator) {
    super();
    this.wrapper = this.createDiv();
    this.orchestrator = orchestrator;

    // Initializes this overlay for the map and calls `onAdd`
    this.setMap(map);
  }

  /**
   * Called when this overlay is added to a map (when `setMap` is called).
   */
  onAdd() {
    // Overlays are placed in one of a number of panes, here we use the overlay layer to appear
    // above terrain and other details
    this.getPanes().overlayLayer.appendChild(this.wrapper);
    this.orchestrator.begin({
      overlayView: this,
      wrapper: this.wrapper,
    });

    this.getMap().addListener('zoom', (e: any) => console.log('event', e));
  }

  /**
   * Called when the overlay should redraw itself.
   */
  draw() {
    // TODO might need to forward these calls to the orchestrator in case there is a way to move the
    //      map without triggering the drag/zoom handlers.
  }

  /**
   * Called when the overlay is removed from a map so that it can clean up resources.
   */
  onRemove() {
    this.orchestrator.reset();
    this.wrapper.remove();
  }

  private createDiv(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    return wrapper;
  }
}
