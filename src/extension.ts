import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { TouchpadToggle } from './toggle.js';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';
import { IconIndicator } from './icon.js';
import {
    SEND_EVENTS_DISABLED,
    SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE,
    SEND_EVENTS_ENABLED,
    SETTINGS_SCHEMA_ID,
    TouchpadState,
} from './types.js';

/**
 * QuickTouchpadToggleExtension class
 * Main extension class that handles enabling and disabling the touchpad toggle in the quick settings menu.
 */
export default class QuickTouchpadToggleExtension extends Extension {
    private extensionSettings?: Gio.Settings; // GNOME settings for the extension
    private touchpadSettings?: Gio.Settings; // GNOME touchpad settings
    private toggleIndicator?: SystemIndicator; // Indicator for the touchpad toggle in quick settings
    private iconIndicator?: IconIndicator; // Indicator for the icon in the status area

    private listenerShowIndicator?: number;
    private listenerTouchpadState?: number;
    private listenerTouchpadToggle?: number;

    /**
     * Enables the extension.
     * Initializes GNOME settings, creates the touchpad toggle, and adds it to the quick settings menu.
     */
    enable() {
        this.extensionSettings = this.getSettings();
        this.touchpadSettings = new Gio.Settings({ schema_id: SETTINGS_SCHEMA_ID });

        // Enable the quick settings touchpad toggle indicator.
        this.enableToggleIndicator();

        // Check the initial state for the icon indicator and enable it if necessary.
        if (this.extensionSettings.get_boolean('show-indicator')) {
            this.enableIconIndicator();
        }

        // Listen to the 'org.gnome.desktop.peripherals.touchpad'.
        this.listenerTouchpadState = this.touchpadSettings.connect('changed::send-events', () => this.onTouchpadStateChange());

        // Connect to changes in 'show-indicator' setting.
        this.listenerShowIndicator = this.extensionSettings.connect('changed::show-indicator', () => this.onIndicatorStateChange());
    }

    /**
     * Disables the extension.
     * Destroys the quick settings touchpad toggle and cleans up the indicators.
     */
    disable() {
        // Clean up and disable the toggle and icon indicators.
        this.disableToggleIndicator();
        this.disableIconIndicator();

        // Stop listening to the show-indicator setting.
        if (this.listenerShowIndicator) {
            this.extensionSettings!.disconnect(this.listenerShowIndicator);
            this.listenerShowIndicator = null;
        }

        // Stop listening to the GNOME touchpad state.
        if (this.listenerTouchpadState) {
            this.touchpadSettings!.disconnect(this.listenerTouchpadState);
            this.listenerTouchpadState = null;
        }

        this.touchpadSettings = null;
        this.extensionSettings = null;
    }

    /**
     * Retrieves the current touchpad state based on the GNOME settings.
     * Maps the "send-events" setting to a corresponding TouchpadState value.
     * @returns {TouchpadState} - The current touchpad state.
     */
    private getTouchpadState(): TouchpadState {
        const sendEvents = this.touchpadSettings!.get_string('send-events');

        let state;
        switch (sendEvents) {
            case SEND_EVENTS_DISABLED:
                state = TouchpadState.Disabled;
                break;
            case SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE:
                state = TouchpadState.MouseOnly;
                break;
            default:
                state = TouchpadState.Enabled;
        }

        return state;
    }

    /**
     * Handles changes to the 'show-indicator' setting.
     * Enables or disables the icon indicator based on the updated setting value.
     */
    private onIndicatorStateChange() {
        const state = this.extensionSettings!.get_boolean('show-indicator');
        state ? this.enableIconIndicator() : this.disableIconIndicator();
    }

    /**
     * Handles changes to the touchpad state setting ('send-events').
     * Updates both the toggle and icon indicators with the new state.
     */
    private onTouchpadStateChange() {
        let state = this.getTouchpadState();

        if (this.iconIndicator) {
            this.iconIndicator.updateState(state);
        }

        (this.toggleIndicator!.quickSettingsItems[0] as TouchpadToggle).updateState(state);
    }

    /**
     * Updates the 'send-events' setting in the GNOME touchpad settings.
     * Maps the given TouchpadState to the corresponding string value
     * and sets it in the touchpad settings.
     *
     * @param {TouchpadState} state - The desired touchpad state to be applied.
     */
    private updateSendEventsSetting(state: TouchpadState) {
        let value: string;

        switch (state) {
            case TouchpadState.Disabled:
                value = SEND_EVENTS_DISABLED;
                break;
            case TouchpadState.MouseOnly:
                value = SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE;
                break;
            default:
                value = SEND_EVENTS_ENABLED;
        }

        this.touchpadSettings!.set_string('send-events', value);
    }

    /**
     * Enables the touchpad toggle indicator in the quick settings.
     * Creates a new SystemIndicator and adds the TouchpadToggle item.
     */
    private enableToggleIndicator() {
        if (!this.toggleIndicator) {
            let toggle = new TouchpadToggle();
            toggle.updateState(this.getTouchpadState());

            // Touchpad switcher listener.
            this.listenerTouchpadToggle = toggle.connect('state-updated', (_, state: TouchpadState) => {
                this.updateSendEventsSetting(state);
            });

            this.toggleIndicator = new SystemIndicator();
            this.toggleIndicator.quickSettingsItems.push(toggle);
            panel.statusArea.quickSettings.addExternalIndicator(this.toggleIndicator);
        }
    }

    /**
     * Disables the touchpad toggle indicator in the quick settings.
     * Destroys the associated quick settings items and the indicator itself.
     */
    private disableToggleIndicator() {
        if (this.toggleIndicator) {
            // Stop listening to the touchpad switcher.
            this.toggleIndicator.quickSettingsItems[0].disconnect(this.listenerTouchpadToggle!);
            this.listenerTouchpadToggle = null;

            this.toggleIndicator.quickSettingsItems.forEach((item) => item.destroy());
            this.toggleIndicator.destroy();
            this.toggleIndicator = null;
        }
    }

    /**
     * Enables the icon indicator in the status area.
     * Creates a new IconIndicator and adds it to the status area.
     */
    private enableIconIndicator() {
        if (!this.iconIndicator) {
            this.iconIndicator = new IconIndicator();
            panel.statusArea.quickSettings.addExternalIndicator(this.iconIndicator);
            this.iconIndicator.updateState(this.getTouchpadState());
        }
    }

    /**
     * Disables the icon indicator in the status area.
     * Destroys the associated quick settings items and the indicator itself.
     */
    private disableIconIndicator() {
        if (this.iconIndicator) {
            this.iconIndicator.quickSettingsItems.forEach((item) => item.destroy());
            this.iconIndicator.destroy();
            this.iconIndicator = null;
        }
    }
}
