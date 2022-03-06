import WcPlayer from './Player';
import { HTML5AudioPlayer, HTML5VideoPlayer } from './Html5';
import LocalStore from './LocalStore';

WcPlayer.use(HTML5AudioPlayer);
WcPlayer.use(HTML5VideoPlayer);
WcPlayer.setStore(new LocalStore());

WcPlayer.define();
