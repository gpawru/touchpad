#!/bin/bash
DOMAIN="touchpad-switcher"

xgettext --from-code=UTF-8 \
         --language=TypeScript \
         --keyword=_ \
         --output=po/${DOMAIN}.pot \
         src/extension.ts src/prefs.ts src/toggle.ts

echo "Updated ${DOMAIN}.pot"
