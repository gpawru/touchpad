EXTENSION_UUID = touchpad@gpawru
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)

.PHONY: run init

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x1080 \
	dbus-run-session -- gnome-shell --nested --wayland
	
init:
	@mkdir -p $(dir $(EXTENSION_DIR))
	@ln -sf "$(shell pwd)" "$(EXTENSION_DIR)"
	@echo "Symbolic link created: $(EXTENSION_DIR) -> $$PWD"
