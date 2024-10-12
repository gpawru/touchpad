import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PREFS_WINDOW_TITLE = _('prefs.window.title', 'Touchpad switcher preferences');
const PREFS_WINDOW_ICON = 'input-touchpad-symbolic';

const PREFS_GROUP_APPEARANCE_TITLE = _('prefs.group.appearance.title', 'Appearance');
const PREFS_GROUP_APPEARANCE_DESCRIPTION = _('prefs.group.appearance.description', 'Configure the appearance of Touchpad Switcher');

const PREFS_SHOW_INDICATOR_TITLE = _('prefs.show_indicator.title', 'Show indicator');
const PREFS_SHOW_INDICATOR_SUBTITLE = _('prefs.show_indicator.subtitle', 'Whether to show the panel indicator');
// const PREFS_SHOW_INDICATOR_ICON = '';

/**
 * TouchpadExtensionPreferences class
 * Manages the preferences window for the extension. This class fills the window with relevant settings UI.
 */
export default class TouchpadExtensionPreferences extends ExtensionPreferences {
    /**
     * Fills the preferences window with the extension's settings.
     * Creates a preferences page with general settings and binds a switch for showing the touchpad indicator.
     *
     * @param window - The preferences window object from Adw.PreferencesWindow.
     * @returns A Promise that resolves once the window is filled.
     */
    fillPreferencesWindow(window: Adw.PreferencesWindow & { gSettings?: Gio.Settings }): Promise<void> {
        // Create a preferences page with a title and icon.
        const page = new Adw.PreferencesPage({
            title: PREFS_WINDOW_TITLE(),
            icon_name: PREFS_WINDOW_ICON,
        });
        window.add(page);

        // Create a appearance settings group with a title and description.
        const generalGroup = new Adw.PreferencesGroup({
            title: PREFS_GROUP_APPEARANCE_TITLE(),
            description: PREFS_GROUP_APPEARANCE_DESCRIPTION(),
        });
        page.add(generalGroup);

        // Create a switch for showing the touchpad indicator in the UI.
        const showIndicator = new Adw.SwitchRow({
            title: PREFS_SHOW_INDICATOR_TITLE(),
            // icon_name: PREFS_SHOW_INDICATOR_ICON,
            subtitle: PREFS_SHOW_INDICATOR_SUBTITLE(),
        });
        generalGroup.add(showIndicator);

        // Bind the 'show-indicator' setting to the switch control.
        window.gSettings = this.getSettings();
        window.gSettings.bind('show-indicator', showIndicator, 'active', Gio.SettingsBindFlags.DEFAULT);

        return Promise.resolve();
    }
}

function _(id: string, defaultValue: string): () => string {
    return () => {
        const translated = gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}
