
export interface SeekOptions {
  bgColor: string;
  thumbColor: string;
  filledColor: string;
}

export class SeekElement extends HTMLElement {
  _options: SeekOptions;
  constructor(opt?: SeekOptions) {
    super();
    const defaultStyle: SeekOptions = { bgColor: '#d3d3d3', thumbColor: '#ff426b', filledColor: '#ff426b' };
    this._options = Object.assign(defaultStyle, opt);
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback(): void {
    this.reload();
  }

  static get observedAttributes(): string[] {
    return ['time', 'duration'];
  }

  attributeChangedCallback(name: string): void {
    if (name == 'time' || name == 'duration') {
      this.style.setProperty('--_perc', (this.currentTime / this.duration).toString());
      (this.shadowRoot.querySelector('.seek-slider') as HTMLInputElement).max = this.duration.toString();
      (this.shadowRoot.querySelector('.seek-slider') as HTMLInputElement).value = this.currentTime.toString();
    }
  }

  reload(): void {
    this.shadowRoot.innerHTML = this.build();
    this.shadowRoot.querySelector('.seek-slider').addEventListener('change', () => {
      this.onChangeListener();
    });
    this.shadowRoot.querySelector('.seek-slider').addEventListener('input', () => {
      this.onChangeListener();
    });
  }

  private onChangeListener(): void {
    const newTime = parseInt((this.shadowRoot.querySelector('.seek-slider') as HTMLInputElement).value);
    requestAnimationFrame(() => {
      this.style.setProperty('--_perc', (newTime / this.duration).toString());
    });
    this.dispatchEvent(
      new CustomEvent('seekchange', {
        detail: {
          time: newTime,
        },
      }),
    );
  }

  build(): string {
    return `<style>
        :host {
          --_perc: ${this.currentTime / this.duration};
        }
        .seek-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 1px;
          background: linear-gradient(to right,
            var(--slider-bg-active, ${this.options.filledColor}) 0%,
            var(--slider-bg-active, ${this.options.filledColor}) calc(var(--_perc) * 100%),
            var(--slider-bg, ${this.options.bgColor}) calc(var(--_perc) * 100%),
            var(--slider-bg, ${this.options.bgColor} 100%));
          outline: none;
          opacity: 0.7;
          -webkit-transition: 0.2s;
          transition: opacity 0.2s;
        }

        .seek-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${this.options.thumbColor};
          cursor: pointer;
        }

        .seek-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${this.options.thumbColor};
          cursor: pointer;
        }

        .seek-slider::-moz-range-progress {
          background-color: ${this.options.filledColor};
        }
      </style>
      <div class="seek-container">
        <input
          type="range"
          min="0"
          step="0.25"
          max="${this.duration}"
          value="${this.currentTime}"
          class="seek-slider"
        />
      </div>`;
  }

  get duration(): number {
    const duration = this.hasAttribute('duration') ? parseInt(this.getAttribute('duration')) : 0;
    return !isNaN(duration) ? duration : 0;
  }

  get currentTime(): number {
    const currentTime = this.hasAttribute('time') ? parseInt(this.getAttribute('time')) : 0;
    return !isNaN(currentTime) ? currentTime : 0;
  }

  get options(): SeekOptions {
    return this._options;
  }

  set options(opt: SeekOptions) {
    this._options = opt;
  }
}

customElements.define('seek-element', SeekElement);
