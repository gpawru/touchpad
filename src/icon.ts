import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { SEND_EVENTS_DISABLED, SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE, SETTINGS_SCHEMA_ID } from './types.js';

const ICON_TOUCHPAD = 'input-touchpad-symbolic';
const ICON_TOUCHPAD_DISABLED = 'touchpad-disabled-symbolic';
const ICON_MOUSE_ONLY = 'input-mouse-symbolic';

/**
 * IconIndicator class
 * Represents the icon indicator in the system indicators menu.
 */
export const IconIndicator = GObject.registerClass(
    {
        GTypeName: 'IconIndicator',
        Properties: {},
        Signals: {},
    },
    class IconIndicator extends SystemIndicator {
        private icon: St.Icon; // The icon to represent the touchpad state
        private gSettings: Gio.Settings; // GNOME settings to monitor for changes

        constructor() {
            super();
            this.icon = this._addIndicator();

            // Connect to the GNOME settings schema to listen for changes in touchpad settings.
            this.gSettings = new Gio.Settings({ schema_id: SETTINGS_SCHEMA_ID });
            this.gSettings.connect('changed::send-events', () => {
                this.updateState();
            });

            this.updateState();
        }

        /**
         * Update the icon based on the current state of the touchpad GNOME settings.
         */
        private updateState() {
            const sendEvents = this.gSettings.get_string('send-events');

            switch (sendEvents) {
                case SEND_EVENTS_DISABLED:
                    this.icon.icon_name = ICON_TOUCHPAD_DISABLED;
                    break;
                case SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE:
                    this.icon.icon_name = ICON_MOUSE_ONLY;
                    break;
                default:
                    this.icon.icon_name = ICON_TOUCHPAD;
            }
        }
    }
);
