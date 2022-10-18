import WcPlayer from "../Player";
import { AbstractPlayer, Features } from "../PlayerInterface";

export class YoutubePlayer extends AbstractPlayer {
  static platform = 'youtube';
  static apiURL(videoid: string) {
    return `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoid}`;
  }
  youtubePlayer!: YT.Player;
  container: HTMLDivElement;
  _updateTimeInterval: number | null;
  _autoplay: boolean;
  _duration: number;
  constructor(parent?: WcPlayer) {
    super(parent);
    this.attachShadow({ mode: 'open' });
    const htmlElement = this.parent!.slotChildElement as HTMLIFrameElement;
    this.source = htmlElement.src || '';
    this.container = document.createElement('div');
    this.shadowRoot!.append(this.container);
    this._duration = 0;
    this._autoplay = false;
    this._updateTimeInterval = null;

    if (window.YT !== undefined && window.YT.Player !== undefined) {
      this.loadApi();
    } else {
      // Reference current global callback
      const callback = window.onYouTubeIframeAPIReady;

      // Set callback to process queue
      window.onYouTubeIframeAPIReady = () => {
        // Call global callback if set
        if (callback !== undefined) { 
          callback();
        }

        this.loadApi();
      };

      // Load the SDK
      this.loadYouTubeApi();
    }
  }

  get youtubeId(): string {
    if (this.source === "") return "";
    const matches = this.source.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return matches !== null && matches.length >= 3 ? matches[2] : this.source;
  }

  loadApi() {
    this.youtubePlayer = new window.YT.Player(this.container, {
      videoId: this.youtubeId,
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: this.autoplay ? 1 : 0,
      },
      events: {
        'onError': this.onError.bind(this),
        'onReady': this.onPlayerReady.bind(this),
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onPlaybackRateChange': this.onPlaybackRateChange.bind(this),
      }
    });
  }

  onError(event: YT.OnErrorEvent): void {
    // Messages copied from https://developers.google.com/youtube/iframe_api_reference#onError
    const messages =
    {
      2: 'The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.',
      5: 'The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.',
      100: 'The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.',
      101: 'The owner of the requested video does not allow it to be played in embedded players.',
      150: 'The owner of the requested video does not allow it to be played in embedded players.',
    };
    console.error('onError', event);
    console.error(messages[event.data]);
    this.emit('error', { player: this });
  }

  async onPlayerReady(event: YT.PlayerEvent) {
    try {
      const response = await fetch(YoutubePlayer.apiURL(this.youtubeId));
      const data = await response.json();
      this.title = data.title;
    } catch (e) {
      console.error(e);
    }
    if (this.autoplay) {
      this.play();
    }
  }

  onPlaybackQualityChange(event: YT.OnPlaybackQualityChangeEvent) {
    this.emit('qualitychange', { player: this });
  }

  onPlaybackRateChange(event: YT.OnPlaybackRateChangeEvent) {
    this.emit('playbackratechange', { player: this });
  }

  onPlayerStateChange(event: YT.OnStateChangeEvent) {
    switch (event.data) {
      case YT.PlayerState.ENDED:
        this.emit('ended', { player: this });
        break;
      case YT.PlayerState.PLAYING:
        this._playing = true;
        this._updateTimeInterval = setInterval(() => {
          this.emit('timeupdate', { player: this });
        }, 100)
        this.emit('playing', { player: this });
        const duration = this.youtubePlayer.getDuration()
        if (duration > 0 && duration !== this.duration) {
          this.duration = duration;
          this.emit('durationchange', { player: this });
        }
        break;
      case YT.PlayerState.PAUSED:
        this._playing = false;
        if (this._updateTimeInterval !== null) {
          clearInterval(this._updateTimeInterval);
          this._updateTimeInterval = null;
        }
        this.emit('pause', { player: this });
        break;
      case YT.PlayerState.BUFFERING:
        this.emit('waiting', { player: this });
        break;
      case YT.PlayerState.CUED:
        break;
    }
  }
  
  loadYouTubeApi() {
    // This code loads the IFrame Player API code asynchronously.
    const tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
  }
  
  reloadPlayer() {
    this.shadowRoot!.innerHTML = "";
    this.container = document.createElement('div');
    this.shadowRoot!.append(this.container);
    this.loadApi();
  }
  getAvailableQualities(): YT.SuggestedVideoQuality[] {
    return this.youtubePlayer.getAvailableQualityLevels();
  }
  async play(): Promise<void> {
    this.youtubePlayer.playVideo();
  }
  async pause(): Promise<void> {
    this.youtubePlayer.pauseVideo();
  }
  async seek(t: number): Promise<void> {
    this.youtubePlayer.seekTo(t, true);
  }
  async stop(): Promise<void> {
    this.youtubePlayer.stopVideo();
  }
  async requestPictureInPicture(): Promise<PictureInPictureWindow> {
    throw new Error("Method not implemented.");
  }
  get isPiPElement(): boolean {
    return false;
  }
  get supportedFeatures(): Features[] {
    return [Features.FULLSCREEN, Features.LOOP, Features.PLAYBACK_RATE, Features.SEEK, Features.VOLUME];
  }
  static matchElement(el: Element): boolean {
    return el.tagName === 'IFRAME' && el.hasAttribute('src') && el.getAttribute('src')!.includes('youtube');
  }
  get currentTime(): number {
    return this.youtubePlayer.getCurrentTime();
  }
  set currentTime(currentTime: number) {
    this.seek(currentTime);
  }

  get duration(): number {
    return this._duration;
  }

  set duration(value: number) {
    this._duration = value;
  }

  get volume(): number {
    return this.youtubePlayer.getVolume() / 100;
  }

  set volume(volume: number) {
    this.youtubePlayer.setVolume(volume < 1 ? volume * 100 : 100);
    setTimeout(() =>{
      this.emit('volumechange', { player: this });
    }, 200);
  }

  get muted(): boolean {
    return this.youtubePlayer.isMuted();
  }

  set muted(mute: boolean) {
    mute ? this.youtubePlayer.mute() : this.youtubePlayer.unMute();
    // Volume change event needs to be delayed to avoid a bug in the YouTube API
    setTimeout(() =>{
      this.emit('volumechange', { player: this });
    }, 200);
  }

  get autoplay(): boolean {
    return this._autoplay;
  }

  set autoplay(autoplay: boolean) {
    this._autoplay = autoplay;
  }

  get quality(): number {
    return this.getAvailableQualities().indexOf(this.youtubePlayer.getPlaybackQuality());
  }
  set quality(quality: number) {
    this.youtubePlayer.setPlaybackQuality(this.getAvailableQualities()[quality]);
  }
}

customElements.define('youtube-player', YoutubePlayer);