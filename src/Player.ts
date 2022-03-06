import { AbstractPlayer, PlayerConstructor } from './PlayerInterface';
import { ToggableControls, WcControls } from './Controls';
import { StoreInterface } from './StoreInterface';
import { WcPlayerEventMap } from './events';
import { inRange } from './utils';

type WcStore = {
  store: StoreInterface;
  isGlobal: boolean;
};

export default class WcPlayer extends HTMLElement {
  private _platform: typeof PlayerConstructor;
  static platforms: Map<string, typeof PlayerConstructor> = new Map();
  public currentPlayer: PlayerConstructor;
  private controls = new WcControls();
  static store: StoreInterface;
  constructor(type = '', source = '') {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = this.build();
    this.attachControllerEvents();
    this.controls.shownElements = this.shownElements;
    this.shadowRoot.querySelector('.wcplayer').append(this.controls);
    const slot = this.shadowRoot.querySelector('slot.platform');
    slot.classList.add('hide');
    if (type !== undefined && type !== '') {
      this.type = type;
    }
    if (source !== undefined && source !== '') {
      this.source = source;
    } else if (this.slotChildElement !== undefined) {
      const platform = Array.from(WcPlayer.platforms.values()).find((plt) => plt.matchElement(this.slotChildElement));
      if (platform !== undefined) {
        this.platform = platform.platform;
      }
    }
  }

  static use(pltClass: typeof PlayerConstructor): void {
    console.log(WcPlayer.platforms);
    if (pltClass.prototype instanceof AbstractPlayer) {
      if (!WcPlayer.platforms.has(pltClass.platform)) WcPlayer.platforms.set(pltClass.platform, pltClass);
    }
  }

  static setStore(store: StoreInterface): void {
    WcPlayer.store = store;
  }

  static define(): void {
    customElements.define('wc-player', WcPlayer);
  }

  get store(): StoreInterface {
    return WcPlayer.store;
  }

  build(): string {
    return `
    <style>
      .wcplayer {
        width: 100%;
        height: 100%;
        background: black;
        overflow: hidden;
      }
      .player {
        width: 100%;
        height: 100%;
      }
      .hide {
        display: none;
      }
    </style>
    <div class="wcplayer">
      <slot class="platform"></slot>
    </div>`;
  }

  static get observedAttributes(): string[] {
    return ['source', 'type', 'muted', 'volume', 'nocontrols', 'autoplay', 'shown-elements'];
  }

  attributeChangedCallback(name: string, previous: string, current: string) {
    if (name == "nocontrols") {
      this.controls.classList.toggle("hide", this.nocontrols);
    } else if (name == 'volume') {
      const volume = inRange(0, 1, parseFloat(current))
      this.volume = volume;
      this.muted = volume == 0;
    } else if (name == "muted") {
      this.muted = this.hasAttribute('muted');
    } else if (name == "source") {
      this.currentPlayer.source = current;
    } else if (name == "type") {
      this.platform = current;
    } else if (name == "autoplay") {
      if (this.autoplay && !this.currentPlayer.playing) {
        this.currentPlayer.autoplay = this.autoplay;
      }
    } else if (name == "shown-elements") {
      this.controls.shownElements = this.shownElements;
      this.controls.reload();
    }
  }

  get platform(): string {
    return this._platform.platform;
  }
  set platform(platform: string) {
    if (!WcPlayer.platforms.has(platform)) {
      console.error(
        `The platform "${platform}" doesn't seem available in this instance of WcPlayer. Please check that you've correctly imported it and set it with the "use" static method.`,
      );
      return;
    }
    this._platform = WcPlayer.platforms.get(platform) as typeof PlayerConstructor;
    if (this.currentPlayer !== undefined) this.shadowRoot.querySelector('.wcplayer')?.removeChild(this.currentPlayer);
    this.currentPlayer = new this._platform(this);
    this.currentPlayer.classList.add('player');
    this.attachPlayerEvents();
    this.shadowRoot.querySelector('.wcplayer').prepend(this.currentPlayer);
    this.controls.featuresAvailable = this.currentPlayer.supportedFeatures;
    this.controls.reload();
  }

  get source(): string {
    return this.hasAttribute('source') ? this.getAttribute('source') : '';
  }

  set source(src: string) {
    if (src !== this.source) {
      this.setAttribute('source', src);
    }
  }

  get type(): string {
    const type = this.hasAttribute('type') ? this.getAttribute('type') : '';
    return type;
  }

  set type(type: string) {
    if (type !== this.type && WcPlayer.platforms.has(type)) {
      this.setAttribute('type', type);
    }
  }

  get volume(): number {
    return this.currentPlayer.volume;
  }

  set volume(level: number) {
    this.currentPlayer.volume = level;
  }

  get muted(): boolean {
    return this.currentPlayer.muted;
  }

  set muted(muted: boolean) {
    this.currentPlayer.muted = muted;
  }

  get autoplay(): boolean {
    return this.hasAttribute("autoplay");
  }

  set autoplay(autoplay: boolean) {
    if (autoplay) {
      this.setAttribute("autoplay", "");
    } else {
      this.removeAttribute("autoplay");
    }
  }

  get shownElements(): ToggableControls[] {
    if (!this.hasAttribute('shown-elements')) return  [
      ToggableControls.PlayPause,
      ToggableControls.Volume,
      ToggableControls.Mute,
      ToggableControls.Timer,
      ToggableControls.Seek,
      ToggableControls.Settings,
      ToggableControls.Fullscreen,
      ToggableControls.PiP,
    ];
    const elements = this.getAttribute('shown-elements')?.split(',');
    return elements as ToggableControls[];
  }

  get nocontrols(): boolean {
    return this.hasAttribute("nocontrols");
  }
  set nocontrols(hide: boolean) {
    if (hide) {
      this.setAttribute("nocontrols", "");
    } else {
      this.removeAttribute("nocontrols")
    }
  }

  get slotChildElement(): Element {
    return (this.shadowRoot.querySelector('slot.platform') as HTMLSlotElement).assignedElements()[0];
  }

  private attachPlayerEvents(): void {
    if (this.currentPlayer !== undefined) {
      this.currentPlayer.addEventListener('durationchange', () => {
        this.emit('beforedurationchange', { wcplayer: this });
        this.controls.elements.timerElement.setAttribute('duration', this.currentPlayer.duration.toString());
        this.controls.elements.timerElement.setAttribute('time', this.currentPlayer.currentTime.toString());
        this.controls.elements.seekElement.setAttribute('duration', this.currentPlayer.duration.toString());
        this.controls.elements.seekElement.setAttribute('time', this.currentPlayer.currentTime.toString());
        this.emit('afterdurationchange', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('timeupdate', () => {
        this.emit('beforetimeupdate', { wcplayer: this });
        this.controls.elements.timerElement.setAttribute('duration', this.currentPlayer.duration.toString());
        this.controls.elements.timerElement.setAttribute('time', this.currentPlayer.currentTime.toString());
        this.controls.elements.seekElement.setAttribute('duration', this.currentPlayer.duration.toString());
        this.controls.elements.seekElement.setAttribute('time', this.currentPlayer.currentTime.toString());
        this.emit('aftertimeupdate', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('volumechange', () => {
        this.emit('beforevolumechange', { wcplayer: this });
        const { volume, muted } = this.currentPlayer;
        if (muted) {
          this.controls.elements.volumeButton.setAttribute('mute', '');
          this.controls.elements.volumeElement.setAttribute('volume', '0');
        } else {
          this.controls.elements.volumeButton.removeAttribute('mute');
          this.controls.elements.volumeElement.setAttribute('volume', volume.toString());
        }
        this.emit('aftervolumechange', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('playing', () => {
        this.emit('beforeplaying', { wcplayer: this });
        this.controls.elements.playPauseButton.removeAttribute('paused');
        this.emit('afterplaying', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('pause', () => {
        this.emit('beforepausing', { wcplayer: this });
        this.controls.elements.playPauseButton.setAttribute('paused', '');
        this.emit('afterpausing', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('ready', () => {
        if (this.currentPlayer.playing) this.controls.elements.playPauseButton.removeAttribute('paused');
        else this.controls.elements.playPauseButton.setAttribute('paused', '');
        const volume = this.hasAttribute("volume") ? inRange(0, 1, parseFloat(this.getAttribute("volume"))) : this.store.get(this, 'volume');
        this.currentPlayer.volume = volume;
        this.emit('ready', { wcplayer: this });
      });
    }
  }
  private attachControllerEvents(): void {
    if (this.controls !== undefined) {
      this.controls.addEventListener('wctoggleplay', () => {
        if (this.currentPlayer !== undefined) {
          if (this.currentPlayer.playing) this.currentPlayer.pause();
          else this.currentPlayer.play();
        }
      });
      this.controls.addEventListener('wcseekchange', (e) => {
        if (this.currentPlayer !== undefined) {
          const { time } = e.detail;
          this.currentPlayer.currentTime = time;
        }
      });
      this.controls.addEventListener('wcvolumechange', (e) => {
        if (this.currentPlayer !== undefined) {
          const { volume } = e.detail;
          if (volume == 0) {
            this.currentPlayer.muted = true;
            return;
          }
          if (this.currentPlayer.muted) this.currentPlayer.muted = false;
          this.currentPlayer.volume = volume;
          this.store.set(this, 'volume', volume);
        }
      });
      this.controls.addEventListener('wcmuted', (e) => {
        if (this.currentPlayer !== undefined) {
          const { muted } = e.detail;
          this.currentPlayer.muted = muted;
          this.store.set(this, 'muted', muted);
        }
      });
      this.controls.addEventListener('wcfullscreen', () => {
        if (document.fullscreenElement !== this) {
          this.requestFullscreen({ navigationUI: 'hide' });
          this.controls.elements.fullscreenButton.setAttribute('fullscreen', '');
        } else {
          document.exitFullscreen();
          this.controls.elements.fullscreenButton.removeAttribute('fullscreen');
        }
      });
      this.controls.addEventListener('wcpip', () => {
        if (!document.pictureInPictureEnabled) {
          console.warn('Your browser does not support picture in picture');
          return;
        }
        const currentPipElement = document.pictureInPictureElement;
        if (!this.currentPlayer.isPiPElement) {
          if (currentPipElement !== null) {
            document.exitPictureInPicture();
          }
          this.currentPlayer.requestPictureInPicture();
        } else if (currentPipElement !== null) {
          document.exitPictureInPicture();
        }
      });
    }
  }
  addEventListener<K extends keyof WcPlayerEventMap>(
    type: K,
    listener: (ev: CustomEvent<WcPlayerEventMap[K]>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof WcPlayerEventMap>(
    type: K,
    listener: (ev: CustomEvent<WcPlayerEventMap[K]>) => void,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }

  emit<K extends keyof WcPlayerEventMap>(type: K, ev: WcPlayerEventMap[K]): void {
    super.dispatchEvent(
      new CustomEvent<WcPlayerEventMap[K]>(type, { detail: ev }),
    );
  }
}
