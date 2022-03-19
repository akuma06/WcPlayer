import WcPlayer from './Player';
import { HTML5AudioPlayer, HTML5VideoPlayer } from './platforms/Html5';
import { YoutubePlayer } from './platforms/Youtube';
import LocalStore from './LocalStore';

WcPlayer.use(HTML5AudioPlayer);
WcPlayer.use(HTML5VideoPlayer);
WcPlayer.use(YoutubePlayer)
WcPlayer.setStore(new LocalStore());

WcPlayer.define();
