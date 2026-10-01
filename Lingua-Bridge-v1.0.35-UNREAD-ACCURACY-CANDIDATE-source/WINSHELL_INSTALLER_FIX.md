# WinShell.dll installer failure workaround

The observed error occurs in the NSIS installer layer while extracting `WinShell.dll` into the Windows TEMP directory. The application itself has already been built successfully when `win-unpacked` exists.

Two safe ways to test v1.0.16 without touching stable v1.0.9:

1. Open the existing `release-v1.0.16-microsoft-fallback-candidate\win-unpacked` folder and run `Lingua Bridge Microsoft Fallback Candidate.exe` directly.
2. Run `BUILD_WINDOWS_v1.0.16_NO_NSIS_ZIP.bat`. This produces a Windows ZIP package and completely avoids the NSIS installer / WinShell.dll extraction step.

This workaround does not disable Windows security and does not modify Vercel production.
