NAME = touchpad@gpawru
SCHEMA_NAME = touchpad_gpawru

EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(NAME)

BUILD_DIR = .build
RELEASE_DIR = .release
PACK_NAME = $(NAME).shell-extension.zip

SCHEMA_XML = schemas/org.gnome.shell.extensions.$(SCHEMA_NAME).gschema.xml

.PHONY: all build locale schemas pack install clean run

all: pack

build: clean
	@mkdir -p $(BUILD_DIR)

	# Extension sources
	@cp metadata.json $(BUILD_DIR)
	@cp src/*.js $(BUILD_DIR)
	@cp LICENSE README.md $(BUILD_DIR)

	# Schemas
	@mkdir -p $(BUILD_DIR)/schemas
	@cp $(SCHEMA_XML) $(BUILD_DIR)/schemas
	@glib-compile-schemas $(BUILD_DIR)/schemas

	# Translations
	@mkdir -p $(BUILD_DIR)/locale
	@for po in po/*.po; do \
		lang=$$(basename $$po .po); \
		mkdir -p $(BUILD_DIR)/locale/$$lang/LC_MESSAGES; \
		msgfmt $$po \
			-o $(BUILD_DIR)/locale/$$lang/LC_MESSAGES/$(NAME).mo; \
	done

pack: build
	@rm -rf $(RELEASE_DIR)
	@mkdir -p $(RELEASE_DIR)

	@cd $(BUILD_DIR) && zip -qr ../$(RELEASE_DIR)/$(PACK_NAME) .

install: build
	@rm -rf $(EXTENSION_DIR)
	@mkdir -p $(EXTENSION_DIR)
	@cp -a $(BUILD_DIR)/. $(EXTENSION_DIR)

clean:
	@rm -rf $(BUILD_DIR) $(RELEASE_DIR)

run:
	env MUTTER_DEBUG_DUMMY_MODE_SPECS=1600x1080 \
		dbus-run-session -- \
		gnome-shell --nested --wayland
