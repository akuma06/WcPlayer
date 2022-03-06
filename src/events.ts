import WcPlayer from './Player';
import { AbstractPlayer } from './PlayerInterface';

// Events common to all player platforms and need to be implemented for each new platform
export type PlayerEvent = {
  player: AbstractPlayer;
};

export interface PlayerEventMap {
  ready: PlayerEvent;
  playing: PlayerEvent;
  waiting: PlayerEvent;
  pause: PlayerEvent;
  timeupdate: PlayerEvent;
  durationchange: PlayerEvent;
  ended: PlayerEvent;
  qualitychange: PlayerEvent;
  playbackratechange: PlayerEvent;
  volumechange: PlayerEvent;
  error: PlayerEvent;
}

// Events relative to control bar
export type VolumeEvent = {
  volume: number;
};

export type MuteEvent = {
  muted: boolean;
};

export type SeekChangeEvent = {
  time: number;
};

export interface ControlsEventMap {
  wctoggleplay: {};
  wcvolumechange: VolumeEvent;
  wcmuted: MuteEvent;
  wcseekchange: SeekChangeEvent;
  wcfullscreen: {};
  wcpip: {};
}

export type WcPlayerEvent = {
  wcplayer: WcPlayer;
};

// Events publicly available to WcPlayer listeners
export interface WcPlayerEventMap {
  beforedurationchange: WcPlayerEvent;
  afterdurationchange: WcPlayerEvent;
  beforeended: WcPlayerEvent;
  afterended: WcPlayerEvent;
  error: WcPlayerEvent;
  beforeplaying: WcPlayerEvent;
  afterplaying: WcPlayerEvent;
  beforepausing: WcPlayerEvent;
  afterpausing: WcPlayerEvent;
  waiting: WcPlayerEvent;
  beforetimeupdate: WcPlayerEvent;
  aftertimeupdate: WcPlayerEvent;
  ready: WcPlayerEvent;
  beforevolumechange: WcPlayerEvent;
  aftervolumechange: WcPlayerEvent;
}
