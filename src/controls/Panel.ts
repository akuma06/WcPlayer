export interface PanelOptions {
  background: string;
}

export class Panel extends HTMLElement {
  private _options: PanelOptions;
  constructor(opt?: PanelOptions) {
    super();
    const defaultStyle: PanelOptions = { background: 'rgba(33, 33, 33, .7)' };
    this._options = Object.assign({}, defaultStyle, opt);
    this.attachShadow({ mode: 'open' });
    this.reload();
  }

  reload(): void {
    this.shadowRoot.innerHTML = this.build();
  }

  build(): string {
    return `<style>
      </style>
      <slot></slot>`;
  }

  attributeChangedCallback(): void {
    this.reload();
  }
  get options(): PanelOptions {
    return this._options;
  }
  set options(opt: PanelOptions) {
    this._options = opt;
  }
}

customElements.define('wc-panel', Panel);
