# Android Release Workflow

Location: `.github/workflows/release-android.yml`

## What it does

- Builds the Flutter Android `release.apk`
- Publishes the APK to a GitHub Release
- Uploads the same APK as a workflow artifact
- Automatically assigns a version for every run
- Reads `FLUTTER_API_BASE_URL` from GitHub Actions variables instead of hardcoding it
- Uses a real keystore automatically when all Android signing secrets are configured

## Trigger

- Automatic: push to `main` when files under `apps/flutter_app/**` change
- Manual: GitHub Actions `workflow_dispatch`

## Version rule

- `versionName`: `YYYY.MM.DD`
- `versionCode`: `GITHUB_RUN_NUMBER`
- Release tag: `android-vYYYY.MM.DD+RUN_NUMBER`

Example:

- `versionName`: `2026.05.06`
- `versionCode`: `128`
- tag: `android-v2026.05.06+128`

## Release config

Workflow inputs are prepared by:

- [scripts/prepare-flutter-android-release.mjs](/Users/apple/project/Yuezhihui/female_menstrual_record_819e28/scripts/prepare-flutter-android-release.mjs:1)

GitHub Actions variable:

- `FLUTTER_API_BASE_URL`

Optional GitHub Actions secrets for signed release builds:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

If all four secrets are present, the workflow writes `apps/flutter_app/android/key.properties` at runtime and signs the APK with that keystore.

## Signing fallback

If signing secrets are not configured, the workflow falls back to the existing `release` configuration in:

- [apps/flutter_app/android/app/build.gradle.kts](/Users/apple/project/Yuezhihui/female_menstrual_record_819e28/apps/flutter_app/android/app/build.gradle.kts:1)

That fallback still uses the debug signing config. This is enough for GitHub Release distribution, but not appropriate for Play Store production publishing.
