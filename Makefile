NAME = touchpad@gpawru
SCHEMA_NAME = touchpad_gpawru
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(NAME)

.PHONY: run all pack install clean

all: .build/extension.js

node_modules: package.json
	pnpm install

.build/extension.js .build/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(SCHEMA_NAME).gschema.xml
	glib-compile-schemas schemas

.release/$(NAME).zip: .build/extension.js .build/prefs.js schemas/gschemas.compiled
	@mkdir .release
	@cp -r schemas .build/
	@cp metadata.json .build/
	@(cd .build && zip ../.release/$(NAME).zip -9r .)

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x1080 dbus-run-session -- gnome-shell --nested --wayland

pack: .release/$(NAME).zip

install: .release/$(NAME).zip
	@touch $(EXTENSION_DIR)
	@rm -rf $(EXTENSION_DIR)
	@mv .build $(EXTENSION_DIR)

clean:
	@rm -rf .build node_modules .release