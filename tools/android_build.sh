#!/usr/bin/env bash
# Builds the Android app (TapTap International, owner 24 Oct 2026): a full-screen WebView of https://doodledoggo.app/play/,
# so cloud saves, languages and site updates work as on the web. Source in android/.
#   ANDROID_SDK=<sdk with build-tools;35.0.0 and platforms;android-35> KEYSTORE=<doodledoggo-release.jks> KEYPASS=<password> \
#   bash tools/android_build.sh <versionCode> <versionName>
# versionCode must go up by 1 for every TapTap upload. The keystore is the owner's and never goes in git.
set -euo pipefail
cd "$(dirname "$0")/.."
VC="${1:?versionCode}"; VN="${2:?versionName}"
: "${ANDROID_SDK:?}" "${KEYSTORE:?}" "${KEYPASS:?}"
BT="$ANDROID_SDK/build-tools/35.0.0"; JAR="$ANDROID_SDK/platforms/android-35/android.jar"; B=dist/android
rm -rf "$B" && mkdir -p "$B/classes"
"$BT/aapt2" compile --dir android/res -o "$B/res.zip"
"$BT/aapt2" link -I "$JAR" --manifest android/AndroidManifest.xml -A android/assets -o "$B/base.apk" --java "$B/gen" "$B/res.zip" --version-code "$VC" --version-name "$VN"
javac -source 11 -target 11 -nowarn -classpath "$JAR" -d "$B/classes" "$B/gen/app/doodledoggo/R.java" android/src/app/doodledoggo/MainActivity.java
"$BT/d8" --lib "$JAR" --min-api 24 --release --output "$B" $(find "$B/classes" -name '*.class')
cp "$B/base.apk" "$B/unsigned.apk" && (cd "$B" && zip -q -j unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$B/unsigned.apk" "$B/aligned.apk"
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-key-alias doodledoggo --ks-pass "pass:$KEYPASS" --key-pass "pass:$KEYPASS" --out "dist/DoodleDoggo-$VN.apk" "$B/aligned.apk"
echo "wrote dist/DoodleDoggo-$VN.apk (versionCode $VC)"
