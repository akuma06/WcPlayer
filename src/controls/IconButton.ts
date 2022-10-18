export default class IconButton extends HTMLElement {
  private _icon = '';
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = this.build();
  }

  attributeChangedCallback(name: string) {
    if (name === 'color') {
      this.btn.querySelector('wc-icon')!.setAttribute('color', this.color);
    }
  }

  get btn(): HTMLButtonElement {
    return this.shadowRoot!.querySelector('button')!;
  }

  get color(): string {
    if (this.hasAttribute('color')) return this.getAttribute('color')!;
    return 'white';
  }

  set color(color: string) {
    this.setAttribute('color', color);
  }

  static get observedAttributes(): string[] {
    return ['color'];
  }

  get icon(): string {
    return this._icon;
  }

  set icon(icon: string) {
    this._icon = icon;
    this.btn.querySelector('wc-icon')!.setAttribute('icon', icon);
  }

  build(): string {
    return `
    <style>
    button {
      background: none;
      border: 0;
      cursor: pointer;
      opacity: 0.9;
      transition: opacity 0.1s;
    }
    button:hover {
      opacity: 1;
    }
    </style>
    <button><wc-icon icon="${this.icon}" color="${this.color}" /></button>`;
  }
}
