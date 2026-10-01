# Lingua Bridge v1.0.12 — Signal launcher fix candidate

## Fixed
- Signal no longer blindly opens `sgnl://`. This removes the Windows “You’ll need a new app to open this sgnl link” popup when Signal Desktop is not installed/registered.
- Lingua first looks for an installed Signal Desktop executable.
- If a registered `sgnl://` handler exists, Lingua may use it safely.
- If Signal Desktop is unavailable, Lingua opens the official `https://signal.org/` website instead.

## Preserved
- All v1.0.11 Owner/Admin Custom App Manager behavior.
- Existing messaging services, translation, Current/Global profiles, direct-send, device limits, owner controls and isolated login sessions.

## Important Signal limitation
Signal does not provide an official browser chat/login client. `signal.org` is the official website, while actual desktop messaging requires Signal Desktop linked to Signal on Android/iPhone.
