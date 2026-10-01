# Lingua Bridge v1.0.15 — Chrome/Web In-App + Fast Add Candidate

## Added
- New **Chrome / Web** built-in service in **Add messaging service**.
- Opens a lightweight Chromium browser **inside Lingua** instead of sending the user to an external browser.
- Back, Forward, Home, Reload, address/search field, and Go controls.
- Address field accepts HTTP/HTTPS URLs; plain words become Google searches.
- Each Chrome/Web instance keeps an isolated persistent session and can be added more than once.
- Current URL is remembered so normal Lingua re-renders do not send the browser back to the home page.

## Performance and safety
- Chrome/Web instances deliberately do **not** load Lingua's messenger translation preload, preventing generic page scanning from slowing ordinary browsing.
- Existing session preconnect warmup remains enabled for fast first launch.
- Signal in-app behavior, Signal Desktop launcher, drag-and-drop account ordering, owner/admin custom apps, updated logo, Burmese incoming-display support, and all existing messaging services are preserved.
- This is a side-by-side candidate. Stable Lingua Bridge v1.0.9 is not replaced.

## Important note
This is an Electron/Chromium in-app web browser. It is not the external Google Chrome desktop program embedded inside Lingua. Some websites may apply their own browser/login restrictions.
