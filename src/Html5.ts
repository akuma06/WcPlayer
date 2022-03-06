import { AbstractPlayer } from './PlayerInterface';
import WcPlayer from './Player';

enum HTML5PlayerType {
  AUDIO,
  VIDEO,
}

class HTML5Player extends AbstractPlayer {
  static platform = 'html5';
  static playerType: HTML5PlayerType;
  protected player: HTMLMediaElement;
  constructor(parent?: WcPlayer) {
    super(parent);
    this.attachShadow({ mode: 'open' });
    const htmlElement = this.parent.slotChildElement as HTMLMediaElement;
    this.reloadPlayer();
    this.source = htmlElement.currentSrc || htmlElement.src || '';
  }

  attributeChangedCallback(name: string): void {
    if (name === 'quality') {
      this.getAvailableQualities().then((qualities) => {
        if (qualities.length > 0 && qualities[this.quality] !== undefined) {
          this.source = this.sources[this.quality].getAttribute('src');
        }
      });
    }
    if (name === 'source') {
      const currentTime = this.player.currentTime;
      const isPaused = this.player.paused;
      this.player.setAttribute('src', this.source);
      this.player.currentTime = currentTime;
      if (!isPaused) {
        this.player.play();
      }
    }
  }

  reloadPlayer(): void {
    this.shadowRoot.innerHTML = `
    <style>
      audio, video {
        height: 100%;
        width: 100%;
      }
    </style>
    `;
    if (this.player !== undefined) this.shadowRoot.removeChild(this.player);
    this.player = document.createElement(
      (this.constructor as typeof HTML5Player).playerType === HTML5PlayerType.AUDIO ? 'audio' : 'video',
    );
    this.player.currentTime = 0;
    this.player.muted = this.parent.hasAttribute('muted');
    this.player.autoplay = this.parent.autoplay;
    this.player.setAttribute('src', this.source);
    if (this.autoplay && !this.muted) {
      console.warn('HTML5Player: autoplay is not muted, web browser may not play audio/video');
    }
    this.setListeners();
    this.shadowRoot.appendChild(this.player);
  }

  setListeners(): void {
    this.player.addEventListener('playing', () => {
      this._playing = true;
      this.emit('playing', { player: this });
    });
    this.player.addEventListener('pause', () => {
      this._playing = false;
      this.emit('pause', { player: this });
    });
    this.player.addEventListener('waiting', () => {
      this.emit('waiting', { player: this });
    });
    this.player.addEventListener('durationchange', () => {
      this.emit('durationchange', { player: this });
    });
    this.player.addEventListener('timeupdate', () => {
      this.emit('timeupdate', { player: this });
    });
    this.player.addEventListener('ended', () => {
      this.emit('ended', { player: this });
    });
    this.player.addEventListener('canplay', () => {
      if (this.autoplay) {
        this.play();
      }
      this.emit('ready', { player: this });
    });
    this.player.addEventListener('volumechange', () => {
      this.emit('volumechange', { player: this });
    });
  }
  async play(): Promise<void> {
    this.player.play();
  }
  async pause(): Promise<void> {
    this.player.pause();
  }
  async seek(t: number): Promise<void> {
    this.player.currentTime = t;
  }
  async stop(): Promise<void> {
    this.player.pause();
    this.player.currentTime = 0;
  }
  async getAvailableQualities(): Promise<number[]> {
    return this.sources.map((source) => parseInt(source.getAttribute('size')));
  }

  get currentTime(): number {
    return this.player.currentTime;
  }

  set currentTime(time: number) {
    this.seek(time);
  }

  get duration(): number {
    return this.player.duration;
  }

  get volume(): number {
    return this.player.volume;
  }

  set volume(volume: number) {
    this.player.volume = volume < 1 ? volume : 1;
  }

  get muted(): boolean {
    return this.player.muted;
  }

  set muted(mute: boolean) {
    this.player.muted = mute;
  }

  get autoplay(): boolean {
    return this.player.autoplay;
  }

  set autoplay(autoplay: boolean) {
    this.player.autoplay = autoplay;
  }

  get sources(): HTMLSourceElement[] {
    return Array.from(this.parent.slotChildElement.querySelectorAll('source')).filter((source) => {
      if (source.hasAttribute('type')) {
        const [type, mime] = source.getAttribute('type').split('/');
        if (type === this.getAttribute('type')) {
          if (this.player.canPlayType(type + '/' + mime) === '') {
            return true;
          }
        }
      }
      return false;
    });
  }
}

export class HTML5AudioPlayer extends HTML5Player {
  static platform = 'html5-audio';
  static playerTyoe = HTML5PlayerType.AUDIO;

  static matchElement(el: Element): boolean {
    return el.tagName == 'AUDIO';
  }
}

export class HTML5VideoPlayer extends HTML5Player {
  static platform = 'html5-video';
  static playerTyoe = HTML5PlayerType.VIDEO;

  static matchElement(el: Element): boolean {
    return el.tagName == 'VIDEO';
  }
}

customElements.define('html5-audio-player', HTML5AudioPlayer);
customElements.define('html5-video-player', HTML5VideoPlayer);
