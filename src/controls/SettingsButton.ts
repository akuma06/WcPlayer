import './Icon';
import IconButton from './IconButton';

export default class SettingsButton extends IconButton {

  constructor() {
    super();
    this.icon = 'settings';
  }
}

customElements.define('settings-button', SettingsButton);
