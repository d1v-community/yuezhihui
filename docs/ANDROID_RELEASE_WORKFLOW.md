# Android Release Workflow

Location: `.github/workflows/release-android.yml`

## What it does

- Builds the Flutter Android `release.apk`
- Publishes the APK to a GitHub Release
- Uploads the same APK as a workflow artifact
- Automatically assigns a version for every run

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

## Current signing behavior

The Android app is currently built with the existing `release` configuration in:

- [apps/flutter_app/android/app/build.gradle.kts](/Users/apple/project/Yuezhihui/female_menstrual_record_819e28/apps/flutter_app/android/app/build.gradle.kts:1)

That configuration still uses the debug signing config for release builds. This is enough for GitHub Release distribution, but not appropriate for Play Store production publishing. If you want, the next step is to switch the workflow to a real keystore-based signed release.
