NAME = touchpad@gpawru
SCHEMA_NAME = touchpad_gpawru
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(NAME)
PACK_NAME = $(NAME).shell-extension.zip

.PHONY: run all pack install clean

all: .build/extension.js

node_modules: package.json
	pnpm install

.build/extension.js .build/prefs.js: node_modules
	tsc

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(SCHEMA_NAME).gschema.xml
	glib-compile-schemas schemas

.release/$(PACK_NAME): .build/extension.js .build/prefs.js schemas/gschemas.compiled
	@rm -rf .release && mkdir .release
	@cp -r schemas .build/
	@cp metadata.json .build/
	@gnome-extensions pack .build --out-dir=.release --podir=./../po --force --extra-source=icon.js --extra-source=toggle.js --extra-source=types.js --extra-source=./../LICENSE --extra-source=./../README.md

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x1080 dbus-run-session -- gnome-shell --nested --wayland

pack: .release/$(PACK_NAME)

install: .release/$(PACK_NAME)
	@gnome-extensions install .release/$(PACK_NAME) --force

clean:
	@rm -rf .build node_modules .release