import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {QuickMenuToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {panel} from 'resource:///org/gnome/shell/ui/main.js';

const TouchpadToggle = GObject.registerClass(
    class TouchpadToggle extends QuickMenuToggle {
        _init() {
            super._init({
                title: 'Touchpad',
                subtitle: '',
                iconName: 'input-touchpad-symbolic',
                toggleMode: true,
            });
    
            this.menu.setHeader('input-touchpad-symbolic', 'Touchpad settings');
        
            // Stores the last disabled state (default to 0 - 'disabled')
            this._lastDisabledState = 0;
            
            // Connects settings change event
            this._settings = new Gio.Settings({schema_id: 'org.gnome.desktop.peripherals.touchpad'});
            this._settings.connect('changed::send-events', () => {
                this._updateState()
            });

            // On/Off switch
            this.connect('clicked', () => this._switchClicked())

            // Init menu & sync state on init
            this._initMenu();
            this._updateState();
        }

        // Update state when settings modified
        _updateState() {
            const sendEvents = this._settings.get_string('send-events');
                    
            switch (sendEvents) {
                case 'disabled':
                    // Touchpad switch has two options - On and Off. We will use our remembered disable state.
                    if (this._lastDisabledState == 1) {
                        this._switchTo(1, true);
                    } else {
                        this._switchTo(0, false);
                    }
                    break;
                case 'disabled-on-external-mouse':
                    this._switchTo(1, false);
                    break;
                default:
                    this._switchTo(2, false);
            }
        }

        // On/Off switch
        _switchClicked() {
            if (this.checked) {
                this._switchTo(2, true)
            } else {
                this._switchTo(this._lastDisabledState, true)
            }
        }

        // Switching menu item
        _switchTo(option, changeSettingsState) {
            const check = '    ✓'

            this.enabledOption.label.text = this.enabledOption._title;
            this.disabledOption.label.text = this.disabledOption._title;
            this.offWithMouseOption.label.text = this.offWithMouseOption._title;

            switch (option) {
                case 0:
                    this.subtitle = 'Disabled';
                    this.iconName = 'touchpad-disabled-symbolic';
                    this.checked = false;
                    this._lastDisabledState = 0;
                    this.disabledOption.label.text = this.disabledOption._title + check;
                    changeSettingsState ? this._settings.set_string('send-events', 'disabled') : {};
                    break;
                case 1:
                    this.subtitle = 'Mouse only';
                    this.iconName = 'input-mouse-symbolic';
                    this.checked = false;
                    this._lastDisabledState = 1;
                    this.offWithMouseOption.label.text = this.offWithMouseOption._title + check;
                    changeSettingsState ? this._settings.set_string('send-events', 'disabled-on-external-mouse') : {};
                    break;
                default:
                    this.subtitle = 'Enabled';
                    this.iconName = 'input-touchpad-symbolic';
                    this.checked = true;
                    this.enabledOption.label.text = this.enabledOption._title + check;
                    changeSettingsState ? this._settings.set_string('send-events', 'enabled') : {};
            }
        }

        // Menu initialization
        _initMenu() {
            // Enabled option
            this.enabledOption = new PopupMenu.PopupImageMenuItem('Enabled', 'input-touchpad-symbolic', {});
            this.enabledOption._title = this.enabledOption.label.text;
            this.enabledOption.connect('activate', () => this._switchTo(2, true));

            // Disabled option
            this.disabledOption = new PopupMenu.PopupImageMenuItem('Disabled', 'touchpad-disabled-symbolic', {});
            this.disabledOption._title = this.disabledOption.label.text;
            this.disabledOption.connect('activate', () => this._switchTo(0, true));

            // Off with mouse
            this.offWithMouseOption = new PopupMenu.PopupImageMenuItem('Off with external mouse', 'input-mouse-symbolic', {});
            this.offWithMouseOption._title = this.offWithMouseOption.label.text;
            this.offWithMouseOption.connect('activate', () => this._switchTo(1, true));

            // Add options to popup menu
            this.menu.addMenuItem(this.enabledOption);
            this.menu.addMenuItem(this.disabledOption);
            this.menu.addMenuItem(this.offWithMouseOption);
        }
    });

const TouchpadIndicator = GObject.registerClass(    
    class TouchpadIndicator extends SystemIndicator {
        _init() {
            super._init();
            this._indicator = this._addIndicator();
        }
    }
);

export default class QuickTouchpadToggleExtension extends Extension {
    enable() {
        this._indicator = new TouchpadIndicator(this);
        this._indicator.quickSettingsItems.push(new TouchpadToggle(this));

        panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        this._indicator.quickSettingsItems.forEach(item => item.destroy());
        this._indicator.destroy();
        this._indicator = null;
    }
}
