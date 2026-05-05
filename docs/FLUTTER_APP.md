# Flutter App Plan

Location: `apps/flutter_app`

This Flutter client is intentionally lightweight and reuses the existing backend API at `https://www.yuezhihui.xyz/api`.

## Stack

- Flutter
- `flutter_riverpod` for app state
- `go_router` for routing
- `http` for API calls
- `shared_preferences` for token and locale persistence
- `flutter_localizations` + `gen_l10n` for i18n

## Current Scope

- Email verification login
- Session bootstrap via `GET /api/auth/me`
- Onboarding gating via `GET /api/onboarding/v2/state`
- Analysis overview via `GET /api/analysis/overview`
- App shell with Daily / Analysis / Settings tabs
- Language switch for Chinese and English

## Run

```bash
cd apps/flutter_app
flutter pub get
flutter run --dart-define=API_BASE_URL=https://www.yuezhihui.xyz
```

`API_BASE_URL` defaults to `https://www.yuezhihui.xyz`, so the `--dart-define` is only needed when switching environments.

## Next Steps

1. Port the daily record editor from `apps/app/src/pages/home`.
2. Add full onboarding question flow against `/api/onboarding/v2/*`.
3. Add settings sync for `/api/user/profile`.
4. Normalize backend error codes so client-side localization does not depend on server message text.
