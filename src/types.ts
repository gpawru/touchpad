// GNOME settings.

export const SETTINGS_SCHEMA_ID = 'org.gnome.desktop.peripherals.touchpad';
export const SEND_EVENTS_DISABLED = 'disabled';
export const SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE = 'disabled-on-external-mouse';
export const SEND_EVENTS_ENABLED = 'enabled';

// Touchpad state enum.
export enum TouchpadState {
    Disabled = 0,
    MouseOnly = 1,
    Enabled = 2,
}
