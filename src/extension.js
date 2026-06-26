const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const TouchpadToggle = Me.imports.toggle.TouchpadToggle;
const Settings = Me.imports.settings;

const SHORTCUT_NAME = 'shortcut';

const TouchpadState = {
    Enabled: 0,
    Disabled: 1,
    MouseOnly: 2,
};

var Extension = class Extension {
    constructor() {
        this._settings = null;
        this._touchpadSettings = null;

        this._toggleButton = null;

        this._signalTouchpad = 0;
        this._signalSettings = 0;
        this._signalToggle = 0;
    }

    enable() {
        this._settings = ExtensionUtils.getSettings();
        this._touchpadSettings = new Gio.Settings({
            schema_id: Settings.SETTINGS_SCHEMA_ID,
        });

        this._enableToggle();
        this._bindShortcut();

        this._signalTouchpad = this._touchpadSettings.connect(
            'changed::send-events',
            () => this._onTouchpadChanged()
        );
    }

    disable() {
        this._unbindShortcut();

        if (this._signalTouchpad)
            this._touchpadSettings.disconnect(this._signalTouchpad);

        if (this._signalSettings)
            this._settings.disconnect(this._signalSettings);

        this._disableToggle();

        this._touchpadSettings = null;
        this._settings = null;
    }

    _bindShortcut() {
        Main.wm.addKeybinding(
            SHORTCUT_NAME,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.ALL,
            () => this._toggleTouchpad()
        );
    }

    _unbindShortcut() {
        Main.wm.removeKeybinding(SHORTCUT_NAME);
    }

    _toggleTouchpad() {
        const state = this._getState();

        let next;
        switch (state) {
            case TouchpadState.Enabled:
                next = TouchpadState.Disabled;
                break;
            default:
                next = TouchpadState.Enabled;
        }

        this._applyState(next);
    }

    _getState() {
        const val = this._touchpadSettings.get_string('send-events');

        switch (val) {
            case Settings.SEND_EVENTS_DISABLED:
                return TouchpadState.Disabled;
            case Settings.SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE:
                return TouchpadState.MouseOnly;
            default:
                return TouchpadState.Enabled;
        }
    }

    _applyState(state) {
        let value;

        switch (state) {
            case TouchpadState.Disabled:
                value = Settings.SEND_EVENTS_DISABLED;
                break;
            case TouchpadState.MouseOnly:
                value = Settings.SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE;
                break;
            default:
                value = Settings.SEND_EVENTS_ENABLED;
        }

        this._touchpadSettings.set_string('send-events', value);
    }

    _onTouchpadChanged() {
        const state = this._getState();

        if (this._toggleButton)
            this._toggleButton.updateState(state);
    }

    _enableToggle() {
        if (this._toggleButton)
            return;

        this._toggleButton = new TouchpadToggle();

        this._signalToggle = this._toggleButton.connect(
            'state-updated',
            (_o, state) => this._applyState(state)
        );

        Main.panel.addToStatusArea('touchpad-toggle', this._toggleButton);

        this._onTouchpadChanged();
    }

    _disableToggle() {
        if (!this._toggleButton)
            return;

        if (this._signalToggle)
            this._toggleButton.disconnect(this._signalToggle);

        this._toggleButton.destroy();
        this._toggleButton = null;
    }
};

function init() {
    ExtensionUtils.initTranslations();
    return new Extension();
}
