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

const PREFS_SHORTCUT_GROUP_TITLE = _('prefs.shortcut.group.title', 'Keyboard shortcut');
const PREFS_SHORTCUT_GROUP_DESCRIPTION = _('prefs.shortcut.group.description', 'Assign a keyboard shortcut to quickly toggle the touchpad');
const PREFS_SHORTCUT_SET_LABEL = _('prefs.shortcut.set', 'Set shortcut…');
const PREFS_SHORTCUT_RESET_LABEL = _('prefs.shortcut.reset', 'Reset');

const PREFS_SHORTCUT_WINDOW_TITLE = _('prefs.shortcut.window.title', 'Set shortcut');
const PREFS_SHORTCUT_WINDOW_LABEL = _('prefs.shortcut.window.label', 'Press the desired key combination…');
const PREFS_SHORTCUT_CAPTURED = _('prefs.shortcut.captured', 'Captured: %s');
const PREFS_SHORTCUT_INVALID = _('prefs.shortcut.invalid', 'Invalid combination');
const PREFS_SHORTCUT_NEED_KEY = _('prefs.shortcut.need_key', 'You need to press a regular key (not just modifiers)');

const PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL = _('prefs.shortcut.window.button_cancel', 'Cancel');
const PREFS_SHORTCUT_WINDOW_BUTTON_SET = _('prefs.shortcut.window.button_set', 'Set');

export default class TouchpadExtensionPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window: Adw.PreferencesWindow & { gSettings?: Gio.Settings }): void {
        const page = new Adw.PreferencesPage({
            title: PREFS_WINDOW_TITLE(),
            icon_name: PREFS_WINDOW_ICON,
        });
        window.add(page);

        // === Appearance ===
        const appearanceGroup = new Adw.PreferencesGroup({
            title: PREFS_GROUP_APPEARANCE_TITLE(),
            description: PREFS_GROUP_APPEARANCE_DESCRIPTION(),
        });
        page.add(appearanceGroup);

        const showIndicator = new Adw.SwitchRow({
            title: PREFS_SHOW_INDICATOR_TITLE(),
            subtitle: PREFS_SHOW_INDICATOR_SUBTITLE(),
        });
        appearanceGroup.add(showIndicator);

        // === Shortcut ===
        const shortcutGroup = new Adw.PreferencesGroup({
            title: PREFS_SHORTCUT_GROUP_TITLE(),
            description: PREFS_SHORTCUT_GROUP_DESCRIPTION(),
        });
        page.add(shortcutGroup);

        const shortcutRow = new Adw.ActionRow({
            title: PREFS_SHORTCUT_GROUP_TITLE(),
            subtitle: PREFS_SHORTCUT_GROUP_DESCRIPTION(),
        });

        const shortcutLabel = new Gtk.ShortcutLabel({
            accelerator: this.getCurrentShortcut(),
            hexpand: true,
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
        });

        const setButton = new Gtk.Button({
            label: PREFS_SHORTCUT_SET_LABEL(),
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
        });

        const resetButton = new Gtk.Button({
            icon_name: 'edit-clear-symbolic',
            tooltip_text: PREFS_SHORTCUT_RESET_LABEL(),
            halign: Gtk.Align.END,
            valign: Gtk.Align.CENTER,
        });

        shortcutRow.add_suffix(shortcutLabel);
        shortcutRow.add_suffix(setButton);
        shortcutRow.add_suffix(resetButton);
        shortcutGroup.add(shortcutRow);

        // Bindings
        const settings = this.getSettings();
        window.gSettings = settings;

        settings.bind('show-indicator', showIndicator, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Button handlers
        setButton.connect('clicked', () => {
            this.showShortcutCaptureDialog(window, shortcutLabel);
        });

        resetButton.connect('clicked', () => {
            settings.set_strv('shortcut', []);
            shortcutLabel.set_accelerator('');
        });

        // Initial update
        settings.connect('changed::shortcut', () => {
            shortcutLabel.set_accelerator(this.getCurrentShortcut());
        });
    }

    private getCurrentShortcut(): string {
        const strv = this.getSettings().get_strv('shortcut');
        return strv.length > 0 ? strv[0] : '';
    }

    private showShortcutCaptureDialog(
        window: Adw.PreferencesWindow,
        shortcutLabel: Gtk.ShortcutLabel
    ): void {
        const dialog = new Gtk.Dialog({
            title: PREFS_SHORTCUT_WINDOW_TITLE(),
            transient_for: window,
            modal: true,
            default_width: 420,
        });

        dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL(), Gtk.ResponseType.CANCEL);
        const okButton = dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_SET(), Gtk.ResponseType.OK);
        okButton.sensitive = false;

        const contentArea = dialog.get_content_area();
        const label = new Gtk.Label({
            label: PREFS_SHORTCUT_WINDOW_LABEL(),
            margin_top: 30,
            margin_bottom: 20,
            wrap: true,
        });
        contentArea.append(label);

        let captured = '';
        let handlerId: number | null = null;

        const controller = new Gtk.EventControllerKey();

        const onKeyPressed = (_ctrl: Gtk.EventControllerKey, keyval: number, _keycode: number, state: number) => {
            const defaultModMask = Gtk.accelerator_get_default_mod_mask();
            let mods = state & defaultModMask;
            mods = this.addModifierFromKeyval(mods, keyval);

            const accelerator = this.formatAccelerator(keyval, mods);
            const isOnlyMod = this.isOnlyModifiers(keyval, mods);

            if (isOnlyMod) {
                const escapedAcc = this.escapeAccelerator(accelerator);
                label.set_markup(`<span foreground="red">${PREFS_SHORTCUT_INVALID()}: ${escapedAcc}</span>\n` +
                    `<span size="small">${PREFS_SHORTCUT_NEED_KEY()}</span>`);
                okButton.sensitive = false;
                captured = '';
                return Gdk.EVENT_STOP;
            }

            if (!this.isValidShortcut(keyval, mods)) {
                const escapedAcc = this.escapeAccelerator(accelerator);
                label.set_markup(`<span foreground="red">${PREFS_SHORTCUT_INVALID()}: ${escapedAcc}</span>`);
                okButton.sensitive = false;
                captured = '';
                return Gdk.EVENT_STOP;
            }

            captured = accelerator;
            label.set_text(PREFS_SHORTCUT_CAPTURED().replace('%s', captured));
            okButton.sensitive = true;

            return Gdk.EVENT_STOP;
        };

        handlerId = controller.connect('key-pressed', onKeyPressed);
        dialog.add_controller(controller);

        dialog.connect('response', (_, responseId) => {
            if (responseId === Gtk.ResponseType.OK && captured) {
                this.getSettings().set_strv('shortcut', [captured]);
                shortcutLabel.set_accelerator(captured);
            }

            if (handlerId !== null) {
                controller.disconnect(handlerId);
                handlerId = null;
            }
            dialog.destroy();
        });

        dialog.show();
    }

    private escapeAccelerator(acc: string): string {
        return acc.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    private formatAccelerator(keyval: number, mods: number): string {
        let acc = '';

        if (mods & Gdk.ModifierType.CONTROL_MASK) acc += '<Control>';
        if (mods & Gdk.ModifierType.SHIFT_MASK) acc += '<Shift>';
        if (mods & Gdk.ModifierType.ALT_MASK) acc += '<Alt>';
        if (mods & Gdk.ModifierType.SUPER_MASK) acc += '<Super>';

        if (!this.isModifierKey(keyval)) {
            let keyStr = Gtk.accelerator_name(keyval, 0) || Gdk.keyval_name(keyval) || '';

            if (keyStr.length === 1 && /[a-z]/i.test(keyStr)) {
                keyStr = keyStr.toUpperCase();
            }

            acc += keyStr;
        }

        return acc || (Gdk.keyval_name(keyval) || '');
    }

    private addModifierFromKeyval(mods: number, keyval: number): number {
        switch (keyval) {
            case Gdk.KEY_Super_L:
            case Gdk.KEY_Super_R:
                return mods | Gdk.ModifierType.SUPER_MASK;
            case Gdk.KEY_Alt_L:
            case Gdk.KEY_Alt_R:
                return mods | Gdk.ModifierType.ALT_MASK;
            case Gdk.KEY_Control_L:
            case Gdk.KEY_Control_R:
                return mods | Gdk.ModifierType.CONTROL_MASK;
            case Gdk.KEY_Shift_L:
            case Gdk.KEY_Shift_R:
                return mods | Gdk.ModifierType.SHIFT_MASK;
            default:
                return mods;
        }
    }

    private isModifierKey(keyval: number): boolean {
        return [
            Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
            Gdk.KEY_Control_L, Gdk.KEY_Control_R,
            Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
            Gdk.KEY_Super_L, Gdk.KEY_Super_R,
            Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
            Gdk.KEY_ISO_Level3_Shift,
            Gdk.KEY_Mode_switch
        ].includes(keyval);
    }

    private isOnlyModifiers(keyval: number, _mods: number): boolean {
        return this.isModifierKey(keyval);
    }

    private isValidShortcut(keyval: number, mods: number): boolean {
        if (mods === 0) return false;

        const keyName = Gdk.keyval_name(keyval) || '';
        const forbidden = new Set([
            'Escape', 'Return', 'KP_Enter', 'Tab', 'BackSpace',
            'Delete', 'Insert', 'Home', 'End', 'Page_Up', 'Page_Down',
            'Caps_Lock', 'Num_Lock', 'Scroll_Lock', 'Pause', 'Print', 'Sys_Req'
        ]);

        if (forbidden.has(keyName)) return false;
        return true;
    }
}

function _(id: string, defaultValue: string): () => string {
    return () => {
        const translated = gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}
