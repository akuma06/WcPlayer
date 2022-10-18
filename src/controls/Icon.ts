import * as feather from 'feather-icons';

export default class Icon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot!.innerHTML = this.icon;
  }

  get color(): string {
    if (this.hasAttribute('color')) return this.getAttribute('color')!;
    return 'white';
  }

  set color(color: string) {
    this.setAttribute('color', color);
  }

  static get observedAttributes(): string[] {
    return ['color', 'icon'];
  }

  attributeChangedCallback(name: string) {
    if (name === 'color' || name === 'icon') {
      this.shadowRoot!.innerHTML = this.icon;
    }
  }

  get icon(): string {
    if (!this.hasAttribute('icon')) return '';
    const icon = feather.icons[this.getAttribute('icon')!];
    return icon !== undefined ? icon.toSvg({ color: this.color }) : '';
  }

  set icon(icon: string) {
    this.setAttribute('icon', icon);
  }
}

customElements.define('wc-icon', Icon);
