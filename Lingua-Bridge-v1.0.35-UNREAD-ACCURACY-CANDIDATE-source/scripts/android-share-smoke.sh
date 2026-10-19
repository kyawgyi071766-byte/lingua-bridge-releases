#!/usr/bin/env bash
set -euo pipefail
apk="$1"
package=com.lingua.translate.preview
mkdir -p smoke-results
adb install -r "$apk"
adb shell am force-stop "$package"
adb logcat -c
adb shell am start -W -n "$package/.MainActivity" -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT LinguaSmokeCold
for attempt in $(seq 1 12); do
  sleep 3
  adb shell uiautomator dump /sdcard/lingua-ui.xml >/dev/null 2>&1 || true
  adb pull /sdcard/lingua-ui.xml smoke-results/login.xml >/dev/null 2>&1 || true
  if grep -Eq 'Welcome back|Log in to your Lingua account' smoke-results/login.xml; then break; fi
done
grep -Eq 'Welcome back|Log in to your Lingua account' smoke-results/login.xml
adb shell pidof "$package" >/dev/null
adb exec-out screencap -p > smoke-results/cold-share-login.png
adb shell am start -W -n "$package/.MainActivity" -a android.intent.action.PROCESS_TEXT -t text/plain --es android.intent.extra.PROCESS_TEXT LinguaSmokeWarm --ez android.intent.extra.PROCESS_TEXT_READONLY true
sleep 8
adb shell pidof "$package" >/dev/null
adb shell uiautomator dump /sdcard/lingua-ui.xml >/dev/null
adb pull /sdcard/lingua-ui.xml smoke-results/login.xml >/dev/null
grep -Eq 'Welcome back|Log in to your Lingua account' smoke-results/login.xml
adb exec-out screencap -p > smoke-results/warm-selected-text-login.png
adb logcat -d -b crash > smoke-results/crash.log
if grep -q "Process: $package" smoke-results/crash.log; then
  echo 'FAIL native app crash during share smoke test'
  exit 1
fi
printf '%s\n' 'PASS cold SEND, warm PROCESS_TEXT, native process alive and login boundary preserved. Synthetic text only; no authenticated translation tested.' > smoke-results/RESULT.txt
cat smoke-results/RESULT.txt
