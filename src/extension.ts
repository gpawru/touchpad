import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';
import { TouchpadToggle } from './toggle.js';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';

/**
 * TouchpadIndicator class
 * Represents the touchpad system indicator in the quick settings menu.
 */
const TouchpadIndicator = GObject.registerClass(
    {
        GTypeName: 'TouchpadIndicator',
        Properties: {},
        Signals: {},
    },
    class TouchpadIndicator extends SystemIndicator {}
);

/**
 * QuickTouchpadToggleExtension class
 * Main extension class that handles enabling and disabling the touchpad toggle in the quick settings menu.
 */
export default class QuickTouchpadToggleExtension extends Extension {
    private gSettings?: Gio.Settings;
    private indicator?: SystemIndicator;

    /**
     * Enables the extension.
     * Initializes GNOME settings, creates the touchpad toggle, and adds it to the quick settings menu.
     */
    enable() {
        this.gSettings = this.getSettings();

        this.indicator = new TouchpadIndicator();
        this.indicator.quickSettingsItems.push(new TouchpadToggle());

        panel.statusArea.quickSettings.addExternalIndicator(this.indicator);
    }

    /**
     * Disables the extension.
     * Destroys the quick settings touchpad toggle and cleans up the indicator.
     */
    disable() {
        this.indicator!.quickSettingsItems.forEach((item) => item.destroy());
        this.indicator!.destroy();

        this.indicator = undefined;
        this.gSettings = undefined;
    }
}
