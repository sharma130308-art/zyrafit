# Roadmap

## Open
- [ ] Publish web app (user action: Publish button)
- [ ] Native social login (Google/Apple inside the Capacitor shell) — follow-up plugin work

## Done
- [x] Capacitor deps + config (bundled static SPA build for store, live-reload opt-in)
- [x] Native camera (@capacitor/camera) for food photo + body-scan photo
- [x] Native barcode scanning (@capacitor-mlkit/barcode-scanning, web fallback)
- [x] Native-friendly offline storage (Preferences mirror of localStorage)
- [x] Push notifications registration + device_push_tokens table; local notifications for reminders
- [x] iOS Info.plist strings + Android manifest permissions via scripts/cap-configure.mjs
- [x] In-app account deletion (delete_own_account RPC + Profile UI)
- [x] Native build docs (docs/native-build.md) with exact local commands
- [x] Fresh security scan (only the intentional account-deletion function warning remains)
