import { secondsToString } from '../utils';

export default class TimerElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = this.build();
  }

  attributeChangedCallback(name: string): void {
    if (name == 'duration' || name == 'time') {
      this.shadowRoot!.innerHTML = this.build();
    }
  }

  build(): string {
    return `<span>${this.currentTime} / ${this.duration}</span>`;
  }

  static get observedAttributes(): string[] {
    return ['duration', 'time'];
  }

  get duration(): string {
    const duration = this.getAttribute('duration') !== null ? parseInt(this.getAttribute('duration')!) : 0;
    if (!isNaN(duration)) {
      return secondsToString(duration);
    }
    return '00:00';
  }

  get currentTime(): string {
    const currentTime = this.getAttribute('time') !== null ? parseInt(this.getAttribute('time')!) : 0;
    if (!isNaN(currentTime)) {
      return secondsToString(currentTime);
    }
    return '00:00';
  }
}

customElements.define('timer-element', TimerElement);
