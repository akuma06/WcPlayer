import WcPlayer from './Player';
import { StoreInterface, WcProperties } from './StoreInterface';

export default class LocalStore implements StoreInterface {
  get<K extends keyof WcProperties>(parent: WcPlayer, key: K): WcProperties[K] | null {
    const item = localStorage.getItem(key);
    switch (key) {
      case 'muted':
        return (item == '1') as WcProperties[K];
      case 'volume':
        if (item === null) return 1 as WcProperties[K];
        return (parseFloat(item) || 1) as WcProperties[K];
    }
    return null
  }
  set<K extends keyof WcProperties>(parent: WcPlayer, key: K, value: WcProperties[K]): void {
    localStorage.setItem(key, value.toString());
  }
}
