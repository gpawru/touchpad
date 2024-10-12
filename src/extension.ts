import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { TouchpadToggle } from './toggle.js';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';
import { IconIndicator } from './icon.js';

/**
 * QuickTouchpadToggleExtension class
 * Main extension class that handles enabling and disabling the touchpad toggle in the quick settings menu.
 */
export default class QuickTouchpadToggleExtension extends Extension {
    private gSettings?: Gio.Settings; // GNOME settings for the extension
    private toggleIndicator?: SystemIndicator; // Indicator for the touchpad toggle in quick settings
    private iconIndicator?: SystemIndicator; // Indicator for the icon in the status area

    /**
     * Enables the extension.
     * Initializes GNOME settings, creates the touchpad toggle, and adds it to the quick settings menu.
     */
    enable() {
        this.gSettings = this.getSettings();

        // Enable the quick settings touchpad toggle indicator.
        this.enableToggleIndicator();

        // Check the initial state for the icon indicator and enable it if necessary.
        if (this.gSettings.get_boolean('show-indicator')) {
            this.enableIconIndicator();
        }

        // Connect to changes in 'show-indicator' setting.
        this.gSettings.connect('changed::show-indicator', () => {
            const state = this.gSettings!.get_boolean('show-indicator');
            state ? this.enableIconIndicator() : this.disableIconIndicator();
        });
    }

    /**
     * Disables the extension.
     * Destroys the quick settings touchpad toggle and cleans up the indicators.
     */
    disable() {
        // Clean up and disable the toggle and icon indicators.
        this.disableToggleIndicator();
        this.disableIconIndicator();

        this.gSettings = undefined;
    }

    /**
     * Enables the touchpad toggle indicator in the quick settings.
     * Creates a new SystemIndicator and adds the TouchpadToggle item.
     */
    private enableToggleIndicator() {
        if (!this.toggleIndicator) {
            this.toggleIndicator = new SystemIndicator();
            this.toggleIndicator.quickSettingsItems.push(new TouchpadToggle());
            panel.statusArea.quickSettings.addExternalIndicator(this.toggleIndicator);
        }
    }

    /**
     * Disables the touchpad toggle indicator in the quick settings.
     * Destroys the associated quick settings items and the indicator itself.
     */
    private disableToggleIndicator() {
        if (this.toggleIndicator) {
            this.toggleIndicator!.quickSettingsItems.forEach((item) => item.destroy());
            this.toggleIndicator!.destroy();
            this.toggleIndicator = undefined;
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
        }
    }

    /**
     * Disables the icon indicator in the status area.
     * Destroys the associated quick settings items and the indicator itself.
     */
    private disableIconIndicator() {
        if (this.iconIndicator) {
            this.iconIndicator!.quickSettingsItems.forEach((item) => item.destroy());
            this.iconIndicator!.destroy();
            this.iconIndicator = undefined;
        }
    }
}
