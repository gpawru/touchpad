const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Pango = imports.gi.Pango;
const GLib = imports.gi.GLib;

const Gettext = imports.gettext.domain('touchpad@gpawru');

const ExtensionUtils = imports.misc.extensionUtils;

let settings;

const PREFS_WINDOW_TITLE = _('prefs.window.title', 'Touchpad switcher preferences');

const PREFS_SHORTCUT_GROUP_TITLE = _('prefs.shortcut.group.title', 'Keyboard shortcut');
const PREFS_SHORTCUT_GROUP_DESCRIPTION = _('prefs.shortcut.group.description', 'Assign a keyboard shortcut to quickly toggle the touchpad');

const PREFS_SHORTCUT_SET_LABEL = _('prefs.shortcut.set', 'Set shortcut…');
const PREFS_SHORTCUT_RESET_LABEL = _('prefs.shortcut.reset', 'Reset');

const PREFS_SHORTCUT_WINDOW_TITLE = _('prefs.shortcut.window.title', 'Set shortcut');
const PREFS_SHORTCUT_WINDOW_LABEL = _('prefs.shortcut.window.label', 'Press the desired key combination…');

const PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL = _('prefs.shortcut.window.button_cancel', 'Cancel');
const PREFS_SHORTCUT_WINDOW_BUTTON_SET = _('prefs.shortcut.window.button_set', 'Set');

const PREFS_SHORTCUT_CAPTURED = _('prefs.shortcut.captured', 'Captured: %s');
const PREFS_SHORTCUT_INVALID = _('prefs.shortcut.invalid', 'Invalid combination');

function init() {
    ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
    settings = new Gio.Settings({
        schema_id: 'org.gnome.shell.extensions.touchpad_gpawru'
    });

    const root = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
        margin_top: 12,
        margin_bottom: 12,
        margin_start: 12,
        margin_end: 12,
    });

    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        const win = root.get_root();
        if (win)
            win.set_title(PREFS_WINDOW_TITLE());
        return false;
    });

    root.append(_shortcutGroup());

    root.show();
    return root;
}

// Keyboard shortcut.
function _shortcutGroup() {
    const shortcutGroup = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
        margin_top: 12,
        margin_bottom: 12,
        margin_start: 12,
        margin_end: 12,

    });

    const shortcutTitle = new Gtk.Label({
        label: PREFS_SHORTCUT_GROUP_TITLE(),
        xalign: 0,
    });

    shortcutTitle.add_css_class("title-2");

    const shortcutDescription = new Gtk.Label({
        label: PREFS_SHORTCUT_GROUP_DESCRIPTION(),
        xalign: 0,
    });

    shortcutGroup.append(shortcutTitle);
    shortcutGroup.append(shortcutDescription);

    const shortcutRow = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 12,
        margin_top: 12,
        margin_bottom: 12,
    });

    const setButton = new Gtk.Button({
        label: PREFS_SHORTCUT_SET_LABEL(),
    });

    const resetButton = new Gtk.Button({
        label: PREFS_SHORTCUT_RESET_LABEL(),
    });

    const shortcutValue = new Gtk.Label({
        label: getShortcut(),
    });

    setButton.connect('clicked', () => openShortcutDialog(shortcutGroup, shortcutValue));

    resetButton.connect('clicked', () => {
        settings.set_strv('shortcut', []);
        shortcutValue.set_label('');
    });

    shortcutRow.append(setButton);
    shortcutRow.append(resetButton);
    shortcutRow.append(new Gtk.Box({ hexpand: true }));
    shortcutRow.append(shortcutValue);

    shortcutGroup.append(shortcutRow);
    return shortcutGroup;
}

function getShortcut() {
    const v = settings.get_strv('shortcut');
    return v.length ? v[0] : '';
}

// Shortcut dialog.
function openShortcutDialog(parent, labelWidget) {
    const dialog = new Gtk.Dialog({
        title: PREFS_SHORTCUT_WINDOW_TITLE(),
        transient_for: parent.get_root(),
        modal: true,
        default_width: 400,
    });

    dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_CANCEL(), Gtk.ResponseType.CANCEL);

    const okButton = dialog.add_button(PREFS_SHORTCUT_WINDOW_BUTTON_SET(), Gtk.ResponseType.OK);

    okButton.set_sensitive(false);

    const box = dialog.get_content_area();

    const info = new Gtk.Label({
        label: PREFS_SHORTCUT_WINDOW_LABEL(),
        margin_top: 20,
        margin_bottom: 20,
        wrap: true,
    });

    box.append(info);

    let captured = '';

    const controller = new Gtk.EventControllerKey();

    controller.connect('key-pressed', (_ctrl, keyval, _code, state) => {
        const mods = state & Gtk.accelerator_get_default_mod_mask();
        const acc = formatAccelerator(keyval, mods);

        if (!isValidShortcut(keyval, mods)) {
            info.set_markup('<span foreground="red">' + PREFS_SHORTCUT_INVALID() + '</span>');
            okButton.set_sensitive(false);
            captured = '';
            return Gdk.EVENT_STOP;
        }

        captured = acc;
        info.set_text(PREFS_SHORTCUT_CAPTURED().replace('%s', acc));
        okButton.set_sensitive(true);

        return Gdk.EVENT_STOP;
    });

    dialog.add_controller(controller);

    dialog.connect('response', (_, resp) => {
        if (resp === Gtk.ResponseType.OK && captured) {
            settings.set_strv('shortcut', [captured]);
            labelWidget.set_label(captured);
        }
        dialog.destroy();
    });

    dialog.show();
}

function formatAccelerator(keyval, mods) {
    let acc = '';

    if (mods & Gdk.ModifierType.CONTROL_MASK) acc += '<Control>';
    if (mods & Gdk.ModifierType.SHIFT_MASK) acc += '<Shift>';
    if (mods & Gdk.ModifierType.ALT_MASK) acc += '<Alt>';
    if (mods & Gdk.ModifierType.SUPER_MASK) acc += '<Super>';

    const name = Gdk.keyval_name(keyval);
    if (name) acc += name;

    return acc;
}

function isValidShortcut(keyval, mods) {
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

function _(id, defaultValue) {
    return () => {
        const translated = Gettext.gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}
