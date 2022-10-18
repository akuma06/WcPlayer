import WcPlayer from './Player';

export interface WcProperties {
  volume: number;
  muted: boolean;
}

export interface StoreInterface {
  get<K extends keyof WcProperties>(player: WcPlayer, key: K): WcProperties[K] | null;
  set<K extends keyof WcProperties>(player: WcPlayer, key: K, value: WcProperties[K]): void;
}
