const GObject = imports.gi.GObject;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Gettext = imports.gettext.domain('touchpad@gpawru');

const ICON_TOUCHPAD = 'input-touchpad-symbolic';
const ICON_DISABLED = 'touchpad-disabled-symbolic';
const ICON_MOUSE_ONLY = 'input-mouse-symbolic';

const OPTION_ENABLED = _('toggle.popup.option.enabled', 'Enabled');
const OPTION_MOUSE_ONLY = _('toggle.popup.option.mouseonly', 'Off with external mouse');
const OPTION_DISABLED = _('toggle.popup.option.disabled', 'Disabled');

var TouchpadState = {
    Enabled: 0,
    Disabled: 1,
    MouseOnly: 2,
};

var TouchpadToggle = GObject.registerClass(
    {
        Signals: {
            'state-updated': {
                param_types: [GObject.TYPE_INT],
            },
        },
    },
    class TouchpadToggle extends PanelMenu.Button {
        _init() {
            super._init(0.0, 'Touchpad Toggle');

            this._icon = new St.Icon({
                icon_name: ICON_TOUCHPAD,
                style_class: 'system-status-icon',
            });

            this.add_child(this._icon);

            this._itemEnabled = new PopupMenu.PopupImageMenuItem(
                OPTION_ENABLED(),
                ICON_TOUCHPAD
            );

            this._itemMouse = new PopupMenu.PopupImageMenuItem(
                OPTION_MOUSE_ONLY(),
                ICON_MOUSE_ONLY
            );

            this._itemDisabled = new PopupMenu.PopupImageMenuItem(
                OPTION_DISABLED(),
                ICON_DISABLED
            );

            this._itemEnabled.connect('activate', () =>
                this.emit('state-updated', TouchpadState.Enabled)
            );

            this._itemMouse.connect('activate', () =>
                this.emit('state-updated', TouchpadState.MouseOnly)
            );

            this._itemDisabled.connect('activate', () =>
                this.emit('state-updated', TouchpadState.Disabled)
            );

            this.menu.addMenuItem(this._itemEnabled);
            this.menu.addMenuItem(this._itemMouse);
            this.menu.addMenuItem(this._itemDisabled);
        }

        updateState(state) {
            this._setOrnaments(state);

            switch (state) {
                case TouchpadState.Disabled:
                    this._icon.icon_name = ICON_DISABLED;
                    break;
                case TouchpadState.MouseOnly:
                    this._icon.icon_name = ICON_MOUSE_ONLY;
                    break;
                default:
                    this._icon.icon_name = ICON_TOUCHPAD;
            }
        }

        _setOrnaments(state) {
            this._itemEnabled.setOrnament(
                state === TouchpadState.Enabled
                    ? PopupMenu.Ornament.CHECK
                    : PopupMenu.Ornament.NONE
            );

            this._itemMouse.setOrnament(
                state === TouchpadState.MouseOnly
                    ? PopupMenu.Ornament.CHECK
                    : PopupMenu.Ornament.NONE
            );

            this._itemDisabled.setOrnament(
                state === TouchpadState.Disabled
                    ? PopupMenu.Ornament.CHECK
                    : PopupMenu.Ornament.NONE
            );
        }
    });

function _(id, defaultValue) {
    return () => {
        const translated = Gettext.gettext(id);
        return translated !== id ? translated : defaultValue;
    };
}
