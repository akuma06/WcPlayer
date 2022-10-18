import { AbstractPlayer, PlayerConstructor } from './PlayerInterface';
import { AbstractPlayerControls, ToggableControls, WcControls } from './Controls';
import { StoreInterface } from './StoreInterface';
import { MyCustomEvent, WcPlayerEventMap } from './events';
import { inRange } from './utils';

type WcStore = {
  store: StoreInterface;
  isGlobal: boolean;
};

export default class WcPlayer extends HTMLElement {
  private _platform: typeof PlayerConstructor | null = null;
  static platforms: Map<string, typeof PlayerConstructor> = new Map();
  public currentPlayer: PlayerConstructor | null = null;
  public controls: AbstractPlayerControls | null = null;
  static store: StoreInterface;
  constructor(type = '', source = '', controls: AbstractPlayerControls | null = new WcControls()) {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = this.build();
    if (controls !== null) {
      this.controls = controls;
      this.attachControllerEvents();
      this.controls.classList.add('wc-controls');
      this.controls.shownElements = this.shownElements;
      this.shadowRoot?.querySelector('.wcplayer')?.append(this.controls);
    }
    const slot = this.shadowRoot!.querySelector('slot.platform')!;
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
        position: relative;
      }
      .player {
        width: 100%;
        height: 100%;
      }
      .hide {
        display: none;
      }
      .wc-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
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
      if (this.controls !== null) {
        this.controls.classList.toggle("hide", this.nocontrols);
      }
    } else if (name == 'volume') {
      const volume = inRange(0, 1, parseFloat(current))
      this.volume = volume;
      this.muted = volume == 0;
    } else if (name == "muted") {
      this.muted = this.hasAttribute('muted');
    } else if (name == "source") {
      if (this.currentPlayer !== null) {
        this.currentPlayer.source = current;
      }
    } else if (name == "type") {
      this.platform = current;
    } else if (name == "autoplay") {
      if (this.autoplay && this.currentPlayer !== null && !this.currentPlayer.playing) {
        this.currentPlayer.autoplay = this.autoplay;
      }
    } else if (name == "shown-elements") {
      if (this.controls !== null) {
        this.controls.shownElements = this.shownElements;
      }
    }
  }

  get platform(): string {
    return this._platform?.platform || "";
  }
  set platform(platform: string) {
    if (!WcPlayer.platforms.has(platform)) {
      console.error(
        `The platform "${platform}" doesn't seem available in this instance of WcPlayer. Please check that you've correctly imported it and set it with the "use" static method.`,
      );
      return;
    }
    this._platform = WcPlayer.platforms.get(platform) as typeof PlayerConstructor;
    if (this.currentPlayer !== null) this.shadowRoot!.querySelector('.wcplayer')?.removeChild(this.currentPlayer);
    this.currentPlayer = new this._platform(this);
    this.currentPlayer.classList.add('player');
    this.attachPlayerEvents();
    this.shadowRoot!.querySelector('.wcplayer')?.prepend(this.currentPlayer);
    if (this.controls !== null) {
      this.controls.featuresAvailable = this.currentPlayer.supportedFeatures;
    }
  }

  get source(): string {
    return this.getAttribute('source') || '';
  }

  set source(src: string) {
    if (src !== this.source) {
      this.setAttribute('source', src);
    }
  }

  get type(): string {
    return this.getAttribute('type') || '';
  }

  set type(type: string) {
    if (type !== this.type && WcPlayer.platforms.has(type)) {
      this.setAttribute('type', type);
    }
  }

  get volume(): number {
    return this.currentPlayer?.volume || 0;
  }

  set volume(level: number) {
    if (this.currentPlayer !== null) {
      this.currentPlayer.volume = level;
    }
  }

  get muted(): boolean {
    return this.currentPlayer?.muted || false;
  }

  set muted(muted: boolean) {
    if (this.currentPlayer !== null) {
      this.currentPlayer.muted = muted;
    }
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
    return (this.shadowRoot!.querySelector('slot.platform') as HTMLSlotElement).assignedElements()[0];
  }

  private attachPlayerEvents(): void {
    if (this.currentPlayer !== null) {
      this.currentPlayer.addEventListener('durationchange', () => {
        this.emit('beforedurationchange', { wcplayer: this });
        this.controls?.setDuration(this.currentPlayer!.duration);
        this.controls?.setCurrentTime(this.currentPlayer!.currentTime);
        this.emit('afterdurationchange', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('timeupdate', () => {
        this.emit('beforetimeupdate', { wcplayer: this });
        this.controls?.setDuration(this.currentPlayer!.duration);
        this.controls?.setCurrentTime(this.currentPlayer!.currentTime);
        this.emit('aftertimeupdate', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('volumechange', () => {
        this.emit('beforevolumechange', { wcplayer: this });
        const { volume, muted } = this.currentPlayer!;
        this.controls?.setVolume(muted ? 0 : volume);
        this.emit('aftervolumechange', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('playing', () => {
        this.emit('beforeplaying', { wcplayer: this });
        this.controls?.setPlaying(true);
        this.emit('afterplaying', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('pause', () => {
        this.emit('beforepausing', { wcplayer: this });
        this.controls?.setPlaying(false);
        this.emit('afterpausing', { wcplayer: this });
      });
      this.currentPlayer.addEventListener('ready', () => {
        this.controls?.setPlaying(this.currentPlayer!.playing);
        const volume = this.hasAttribute("volume") ? inRange(0, 1, parseFloat(this.getAttribute("volume") || "0")) : this.store.get(this, 'volume');
        this.currentPlayer!.volume = volume!;
        this.emit('ready', { wcplayer: this });
      });
    }
  }
  private attachControllerEvents(): void {
    if (this.controls !== null) {
      this.controls.addEventListener('wctoggleplay', () => {
        if (this.currentPlayer !== undefined) {
          if (this.currentPlayer?.playing) this.currentPlayer.pause();
          else this.currentPlayer?.play();
        }
      });
      this.controls.addEventListener('wcseekchange', (e) => {
        if (this.currentPlayer !== null && e.detail !== undefined) {
          const { time } = e.detail;
          this.currentPlayer.currentTime = time;
        }
      });
      this.controls.addEventListener('wcvolumechange', (e) => {
        if (this.currentPlayer !== null && e.detail !== undefined) {
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
        if (this.currentPlayer !== null && e.detail !== undefined) {
          const { muted } = e.detail;
          this.currentPlayer.muted = muted;
          this.store.set(this, 'muted', muted);
        }
      });
      this.controls.addEventListener('wcfullscreen', () => {
        if (document.fullscreenElement !== this) {
          this.requestFullscreen({ navigationUI: 'hide' });
          this.controls?.setFullscreen(true);
        } else {
          document.exitFullscreen();
          this.controls?.setFullscreen(false);
        }
      });
      this.controls.addEventListener('wcpip', () => {
        if (!document.pictureInPictureEnabled) {
          console.warn('Your browser does not support picture in picture');
          return;
        }
        const currentPipElement = document.pictureInPictureElement;
        if (!this.currentPlayer?.isPiPElement) {
          if (currentPipElement !== null) {
            document.exitPictureInPicture();
          }
          this.currentPlayer?.requestPictureInPicture();
        } else if (currentPipElement !== null) {
          document.exitPictureInPicture();
        }
      });
    }
  }
  addEventListener<K extends keyof WcPlayerEventMap>(
    type: K,
    listener: (ev: MyCustomEvent<WcPlayerEventMap[K]>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof WcPlayerEventMap>(
    type: K,
    listener: (ev: MyCustomEvent<WcPlayerEventMap[K]>) => void,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }

  emit<K extends keyof WcPlayerEventMap>(type: K, ev: WcPlayerEventMap[K]): void {
    super.dispatchEvent(
      new MyCustomEvent<WcPlayerEventMap[K]>(type, ev),
    );
  }
}
