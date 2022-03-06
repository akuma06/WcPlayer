import { ControlsEventMap, SeekChangeEvent, VolumeEvent } from './events';
import './controls/PlayButton';
import './controls/VolumeElement';
import './controls/TimerElement';
import './controls/SeekElement';
import './controls/SettingsButton';
import './controls/FullscreenButton';
import './controls/PiPButton';
import './controls/VolumeButton';
import './controls/Panel';
import IconButton from './controls/IconButton';
import { Features } from './PlayerInterface';

export interface ControlElements {
  playPauseButton: HTMLElement;
  volumeButton: IconButton;
  volumeElement: HTMLElement;
  timerElement: HTMLElement;
  seekElement: HTMLElement;
  settingsButton: HTMLElement;
  fullscreenButton: HTMLElement;
  pipButton: HTMLElement;
}

export interface PanelElements {
  settingsPanel: HTMLElement;
}

export interface WcControlsProps {
  elements: ControlElements;
  panels: PanelElements;
}

export enum ToggableControls {
  PlayPause = 'playPause',
  Volume = 'volume',
  Mute = 'mute',
  Timer = 'timer',
  Seek = 'seek',
  Settings = 'settings',
  Fullscreen = 'fullscreen',
  PiP = 'pip',
}

export class WcControls extends HTMLElement {
  elements: ControlElements;
  panels: PanelElements;
  featuresAvailable: Features[] = [];
  shownElements: ToggableControls[] = [
    ToggableControls.PlayPause,
    ToggableControls.Volume,
    ToggableControls.Mute,
    ToggableControls.Timer,
    ToggableControls.Seek,
    ToggableControls.Settings,
    ToggableControls.Fullscreen,
    ToggableControls.PiP,
  ];
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.reload();
  }

  get color(): string {
    if (this.hasAttribute('color')) return this.getAttribute('color');
    return 'white';
  }

  set color(color: string) {
    this.setAttribute('color', color);
  }

  static get observedAttributes(): string[] {
    return ['color'];
  }

  attributeChangedCallback(name: string) {
    if (name === 'color') {
      this.reload();
    }
  }

  reload(): void {
    this.shadowRoot.innerHTML = this.build();
    this.elements = {
      playPauseButton: this.shadowRoot.querySelector('play-button'),
      volumeButton: this.shadowRoot.querySelector('volume-button'),
      volumeElement: this.shadowRoot.querySelector('volume-element'),
      timerElement: this.shadowRoot.querySelector('timer-element'),
      seekElement: this.shadowRoot.querySelector('seek-element'),
      settingsButton: this.shadowRoot.querySelector('settings-button'),
      fullscreenButton: this.shadowRoot.querySelector('fullscreen-button'),
      pipButton: this.shadowRoot.querySelector('pip-button'),
    };
    this.panels = {
      settingsPanel: this.shadowRoot.querySelector('settings-panel'),
    };
    this.attachEvents();
  }
  attachEvents(): void {
    this.elements.playPauseButton.addEventListener('click', (e) => {
      this.emit('wctoggleplay', {});
    });
    this.elements.volumeButton.addEventListener('click', (e) => {
      this.emit('wcmuted', {
        muted: !this.elements.volumeButton.hasAttribute('mute'),
      });
    });
    const volumeControl = this.shadowRoot.querySelector('.volume-control') as HTMLDivElement;
    volumeControl.addEventListener('mouseover', () => {
      this.elements.volumeElement.classList.remove('hide');
    });
    volumeControl.addEventListener('mouseout', () => {
      this.elements.volumeElement.classList.add('hide');
    });
    this.elements.seekElement.addEventListener('seekchange', (e: CustomEvent<SeekChangeEvent>) => {
      const { time } = e.detail;
      this.emit('wcseekchange', { time });
    });
    this.elements.volumeElement.addEventListener('volumechange', (e: CustomEvent<VolumeEvent>) => {
      const { volume } = e.detail;
      this.emit('wcvolumechange', { volume });
    });
    this.elements.fullscreenButton.addEventListener('click', () => {
      this.emit('wcfullscreen', {});
    });
    this.elements.pipButton.addEventListener('click', () => {
      this.emit('wcpip', {});
    });
  }

  build(): string {
    return `<style>
        .controls {
          height: 45px;
          width: 100%;
          background: black;
          color: ${this.color};
        }
        .control-list {
          display: flex;
          flex-direction: row;
          overflow: hidden;
          height: 38px;
          align-items: center;
          justify-content: space-between;
        }
        .control-left, .control-right, .volume-control {
          display: flex;
          flex-direction: row;
          align-items: center;
          height: 100%;
        }
        volume-element {
          width: 80px;
          transition: width .3s, visibility .3s;
        }
        .wc-panel {
          position: absolute;
          bottom: 45px;
          right: 10px;
          width: 150px;
          max-height: 30%;
          transition: height .3s, visibility .3s;
        }
        .hide {
          visibility: hidden;
          width: 0;
        }
        .hide-y {
          visibility: hidden;
          height: 0;
        }
        .volume-control {
          margin-right: 5px;
        }
        .disabled {
          display: none;
        }
      </style>
      <div class="controls">
        <seek-element class="seek-element${!this.featuresAvailable.includes(Features.SEEK) || !this.shownElements.includes(ToggableControls.Seek) ? ' disabled' : ''}"></seek-element>
        <div class="control-list">
          <div class="control-right">
            <play-button class="play-button${!this.shownElements.includes(ToggableControls.PlayPause) ? ' disabled' : '' }" color="${this.color}"></play-button>
            <div class="volume-control${!this.featuresAvailable.includes(Features.VOLUME)? ' disabled' : ''}">
              <volume-button class="volume-button${!this.shownElements.includes(ToggableControls.Mute) ? ' disabled' : '' }" color="${this.color}"></volume-button>
              <volume-element class="volume-element hide${!this.shownElements.includes(ToggableControls.Volume) ? ' disabled' : '' }"></volume-element>
            </div>
            <timer-element class="timer-element${!this.shownElements.includes(ToggableControls.Timer) ? ' disabled' : '' }"></timer-element>
          </div>
          <div class="control-left">
            <settings-button class="settings-button${!this.shownElements.includes(ToggableControls.Settings) ? ' disabled' : '' }" color="${this.color}"></settings-button>
            <fullscreen-button class="fullscreen-button${!this.featuresAvailable.includes(Features.FULLSCREEN) || !this.shownElements.includes(ToggableControls.Fullscreen) ? ' disabled' : ''}" color="${this.color}"></fullscreen-button>
            <pip-button class="pip-button${!this.featuresAvailable.includes(Features.PICTURE_IN_PICTURE) || !this.shownElements.includes(ToggableControls.PiP) ? ' disabled' : ''}" color="${this.color}"></pip-button>
          </div>
        </div>
      </div>
      <wc-panel class="wc-panel hide-y"></wc-panel>
      `;
  }
  addEventListener<K extends keyof ControlsEventMap>(
    type: K,
    listener: (ev: CustomEvent<ControlsEventMap[K]>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof ControlsEventMap>(
    type: K,
    listener: (ev: CustomEvent<ControlsEventMap[K]>) => void,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }

  emit<K extends keyof ControlsEventMap>(type: K, ev: ControlsEventMap[K]): void {
    super.dispatchEvent(
      new CustomEvent<ControlsEventMap[K]>(type, { detail: ev }),
    );
  }
}

customElements.define('wc-controls', WcControls);
