import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { TouchpadState } from './types.js';
import { QuickMenuToggle } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { Ornament, PopupImageMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext } from 'resource:///org/gnome/shell/extensions/extension.js';

// GNOME settings.

const SETTINGS_SCHEMA_ID = 'org.gnome.desktop.peripherals.touchpad';
const SEND_EVENTS_DISABLED = 'disabled';
const SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE = 'disabled-on-external-mouse';
const SEND_EVENTS_ENABLED = 'enabled';

// Text and icons.

const TOGGLE_TITLE = _('toggle.title', 'Touchpad');
const TOGGLE_SUBTITLE_ENABLED = _('toggle.subtitle.enabled', 'Enabled');
const TOGGLE_SUBTITLE_MOUSE_ONLY = _('toggle.subtitle.mouseonly', 'Mouse only');
const TOGGLE_SUBTITLE_DISABLED = _('toggle.subtitle.disabled', 'Disabled');

const POPUP_HEADER_TITLE = _('toggle.popup.title', 'Touchpad settings');
const POPUP_OPTION_ENABLED = _('toggle.popup.option.enabled', 'Enabled');
const POPUP_OPTION_MOUSE_ONLY = _('toggle.popup.option.mouseonly', 'Off with external mouse');
const POPUP_OPTION_DISABLED = _('toggle.popup.option.disabled', 'Disabled');

const ICON_TOUCHPAD = 'input-touchpad-symbolic';
const ICON_TOUCHPAD_DISABLED = 'touchpad-disabled-symbolic';
const ICON_MOUSE_ONLY = 'input-mouse-symbolic';

// Etc.

const MODIFY_STATE: boolean = true;

// ---

export const TouchpadToggle = GObject.registerClass(
    {
        GTypeName: 'TouchpadToggle',
        Properties: {},
        Signals: {},
    },
    class TouchpadToggle extends QuickMenuToggle {
        private lastDisabledState: TouchpadState;
        private gSettings: Gio.Settings;
        private enabledOption: PopupImageMenuItem;
        private disabledOption: PopupImageMenuItem;
        private offWithMouseOption: PopupImageMenuItem;

        /**
         * Creates an instance of the TouchpadToggle class, which controls the touchpad
         * state (enabled, disabled, or mouse-only) via GNOME settings. It also initializes
         * the popup menu and connects event listeners for state changes.
         *
         * @constructor
         */
        constructor() {
            super({
                title: TOGGLE_TITLE(),
                subtitle: '',
                iconName: ICON_TOUCHPAD,
                toggleMode: true,
            });

            this.menu.setHeader(ICON_TOUCHPAD, POPUP_HEADER_TITLE());

            // Store the last disabled state. Set to "Disabled" by default.
            this.lastDisabledState = TouchpadState.Disabled;

            // Connect to the GNOME settings schema to listen for changes in touchpad settings.
            this.gSettings = new Gio.Settings({ schema_id: SETTINGS_SCHEMA_ID });
            this.gSettings.connect('changed::send-events', () => {
                this.updateState();
            });

            // Attach event listener for the toggle switch (On/Off).
            this.connect('clicked', () => this.switchClicked());

            // Initialize the popup menu and sync the state when the toggle is created.

            // Enabled option.
            this.enabledOption = new PopupImageMenuItem(POPUP_OPTION_ENABLED(), ICON_TOUCHPAD);
            this.enabledOption.connect('activate', () => this.switchTo(TouchpadState.Enabled, MODIFY_STATE));

            // Disabled option.
            this.disabledOption = new PopupImageMenuItem(POPUP_OPTION_DISABLED(), ICON_TOUCHPAD_DISABLED);
            this.disabledOption.connect('activate', () => this.switchTo(TouchpadState.Disabled, MODIFY_STATE));

            // Off with mouse.
            this.offWithMouseOption = new PopupImageMenuItem(POPUP_OPTION_MOUSE_ONLY(), ICON_MOUSE_ONLY);
            this.offWithMouseOption.connect('activate', () => this.switchTo(TouchpadState.MouseOnly, MODIFY_STATE));

            // Add options to the popup menu.
            this.menu.addMenuItem(this.enabledOption);
            this.menu.addMenuItem(this.disabledOption);
            this.menu.addMenuItem(this.offWithMouseOption);

            this.updateState();
        }

        /**
         * Update the current state of the touchpad based on GNOME settings.
         * This function reads the 'send-events' key from GNOME settings and adjusts the
         * touchpad state accordingly (enabled, disabled, or disabled on external mouse).
         */
        private updateState() {
            const sendEvents = this.gSettings.get_string('send-events');

            switch (sendEvents) {
                case SEND_EVENTS_DISABLED:
                    // The GNOME settings panel has only two touchpad options: Enabled and Disabled.
                    // Instead of completely disabling the touchpad, we remember the last state (Disabled or MouseOnly).
                    this.lastDisabledState == TouchpadState.MouseOnly
                        ? this.switchTo(TouchpadState.MouseOnly, MODIFY_STATE)
                        : this.switchTo(TouchpadState.Disabled);
                    break;
                case SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE:
                    this.switchTo(TouchpadState.MouseOnly);
                    break;
                default:
                    this.switchTo(TouchpadState.Enabled);
            }
        }

        /**
         * Handle the click event of the toggle button. This function switches between
         * the enabled and disabled states based on the user's action.
         */
        private switchClicked() {
            if (this.checked) {
                this.switchTo(TouchpadState.Enabled, MODIFY_STATE);
            } else {
                this.switchTo(this.lastDisabledState, MODIFY_STATE);
            }
        }

        /**
         * Change the current state of the touchpad (enabled, disabled, or mouse only).
         * This function updates both the UI and the GNOME settings based on the given touchpad state.
         *
         * @param option - The new touchpad state to switch to.
         * @param modifySettingsState - Whether to update the GNOME settings (true by default).
         */
        private switchTo(option: TouchpadState, modifySettingsState: boolean = false) {
            this.enabledOption.setOrnament(option == TouchpadState.Enabled ? Ornament.CHECK : Ornament.NONE);
            this.disabledOption.setOrnament(option == TouchpadState.Disabled ? Ornament.CHECK : Ornament.NONE);
            this.offWithMouseOption.setOrnament(option == TouchpadState.MouseOnly ? Ornament.CHECK : Ornament.NONE);

            switch (option) {
                case TouchpadState.Disabled:
                    this.subtitle = TOGGLE_SUBTITLE_DISABLED();
                    this.iconName = ICON_TOUCHPAD_DISABLED;
                    this.checked = false;

                    this.lastDisabledState = TouchpadState.Disabled;
                    modifySettingsState ? this.gSettings.set_string('send-events', SEND_EVENTS_DISABLED) : {};
                    break;
                case TouchpadState.MouseOnly:
                    this.subtitle = TOGGLE_SUBTITLE_MOUSE_ONLY();
                    this.iconName = ICON_MOUSE_ONLY;
                    this.checked = false;

                    this.lastDisabledState = TouchpadState.MouseOnly;
                    modifySettingsState ? this.gSettings.set_string('send-events', SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE) : {};
                    break;
                default:
                    this.subtitle = TOGGLE_SUBTITLE_ENABLED();
                    this.iconName = ICON_TOUCHPAD;
                    this.checked = true;

                    modifySettingsState ? this.gSettings.set_string('send-events', SEND_EVENTS_ENABLED) : {};
            }
        }
    }
);

function _(id: string, defaultValue: string): () => string {
    return () => {
        const translated = gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}