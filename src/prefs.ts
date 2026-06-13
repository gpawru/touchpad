import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import { ExtensionPreferences, gettext } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PREFS_WINDOW_TITLE = _('prefs.window.title', 'Touchpad switcher preferences');
const PREFS_WINDOW_ICON = 'input-touchpad-symbolic';

const PREFS_GROUP_APPEARANCE_TITLE = _('prefs.group.appearance.title', 'Appearance');
const PREFS_GROUP_APPEARANCE_DESCRIPTION = _('prefs.group.appearance.description', 'Configure the appearance of Touchpad Switcher');

const PREFS_SHOW_INDICATOR_TITLE = _('prefs.show_indicator.title', 'Show indicator');
const PREFS_SHOW_INDICATOR_SUBTITLE = _('prefs.show_indicator.subtitle', 'Whether to show the panel indicator');
// const PREFS_SHOW_INDICATOR_ICON = '';

const PREFS_SHORTCUT_GROUP_TITLE = _('prefs.shortcut.group.title', 'Keyboard shortcut');
const PREFS_SHORTCUT_GROUP_DESCRIPTION = _('prefs.shortcut.group.description', 'Assign a keyboard shortcut to quickly toggle the touchpad');
const PREFS_SHORTCUT_SHOW_LABEL = _('prefs.shortcut.show_label', 'Set shortcut...');
const PREFS_SHORTCUT_WINDOW_TITLE = _('prefs.shortcut.window.title', 'Set shortcut');
const PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL = _('prefs.shortcut.window.button_cancel', 'Cancel');
const PREFS_SHORTCUT_WINDOW_BUTTON_SET = _('prefs.shortcut.window.button_set', 'Set');
const PREFS_SHORTCUT_WINDOW_LABEL = _('prefs.shortcut.window.label', 'Press the desired key combination...');
const PREFS_SHORTCUT_CAPTURED = _('prefs.shortuct.captured', 'Captured: %shortcut%\nPress another key or click Set');
const PREFS_SHORTCUT_BUTTON = _('prefs.shortcut.button', 'Shortcut: %shortcut%');


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

        // -- Indicator.

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

        // -- Keybindings.

        const shortcutGroup = new Adw.PreferencesGroup({
            title: PREFS_SHORTCUT_GROUP_TITLE(),
            description: PREFS_SHORTCUT_GROUP_DESCRIPTION(),
        });
        page.add(shortcutGroup);

        // Shortcut button.
        const shortcutButton = new Gtk.Button({
            label: this.getShortcutLabel(),
            halign: Gtk.Align.START,
            valign: Gtk.Align.CENTER,
        });

        // System dialog.
        shortcutButton.connect('clicked', () => {
            this.showShortcutCaptureDialog(window, shortcutButton);
        });
        shortcutGroup.add(shortcutButton);

        // Bind the 'show-indicator' setting to the switch control.
        window.gSettings = this.getSettings();
        window.gSettings.bind('show-indicator', showIndicator, 'active', Gio.SettingsBindFlags.DEFAULT);

        return Promise.resolve();
    }

    private getShortcutLabel(): string {
        const currentShortcut = this.getSettings().get_strv('shortcut');

        if (currentShortcut.length > 0 && currentShortcut[0]) {
            return PREFS_SHORTCUT_BUTTON().replace('%shortcut%', currentShortcut[0]);
        }
        return PREFS_SHORTCUT_SHOW_LABEL();
    }

    private showShortcutCaptureDialog(window: Adw.PreferencesWindow & { gSettings?: Gio.Settings }, button: Gtk.Button) {
        // Dialog window.
        const dialog = new Gtk.Dialog({
            title: PREFS_SHORTCUT_WINDOW_TITLE(),
            transient_for: window,
            modal: true,
        });

        // Dialog buttons.
        dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL(), Gtk.ResponseType.CANCEL);
        dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_SET(), Gtk.ResponseType.OK);

        // Description label.
        const contentArea = dialog.get_content_area();
        const label = new Gtk.Label({
            label: PREFS_SHORTCUT_WINDOW_LABEL(),
            margin_top: 20,
            margin_bottom: 20,
            margin_start: 20,
            margin_end: 20,
        });
        contentArea.append(label);

        const eventController = new Gtk.EventControllerKey();

        let capturedShortcut: string[] = [];
        eventController.connect('key-pressed', (_controller, keyval, _keycode, state) => {
            const modifiers = [];
            if (state & Gdk.ModifierType.SHIFT_MASK)
                modifiers.push('<Shift>');
            if (state & Gdk.ModifierType.CONTROL_MASK)
                modifiers.push('<Control>');
            if (state & Gdk.ModifierType.META_MASK)
                modifiers.push('<Super>');
            if (state & Gdk.ModifierType.ALT_MASK)
                modifiers.push('<Alt>');
            const keyName = Gdk.keyval_name(keyval)?.toUpperCase() || '';
            capturedShortcut = [`${modifiers.join('')}${keyName}`];

            // Refresh text.
            const text = PREFS_SHORTCUT_CAPTURED().replace('%shortcut%', capturedShortcut[0]);
            label.set_text(text);
            return Gdk.EVENT_STOP;
        });
        dialog.add_controller(eventController);

        // Response.
        dialog.connect('response', (_dlg, responseId) => {
            if (responseId === Gtk.ResponseType.OK) {
                this.getSettings().set_strv('shortcut', capturedShortcut);
                button.set_label(this.getShortcutLabel());
            }
            dialog.destroy();
        });
        dialog.show();
    }
}

function _(id: string, defaultValue: string): () => string {
    return () => {
        const translated = gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}
