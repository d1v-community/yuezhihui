# Xcode Cloud and App Store Setup

Project path: `female_menstrual_record_819e28/apps/flutter_app`

Current iOS app identity:

- Bundle ID: `xyz.yuezhihui.application`
- Team ID in project: `J4SP5BPR5Q`
- Scheme: `Runner`
- Version from `pubspec.yaml`: `1.0.0+1`

## Files added for Xcode Cloud

- `ios/ci_scripts/ci_post_clone.sh`

This follows Flutter's recommended Xcode Cloud setup:

1. Clone Flutter stable.
2. Add Flutter to `PATH`.
3. Run `flutter precache --ios`.
4. Run `flutter pub get`.
5. Install CocoaPods.
6. Run `pod install`.

## What you still need to do manually

### 1. Create the app in App Store Connect

In App Store Connect, create a new iOS app with:

- Platform: `iOS`
- Name: your final App Store product name
- Primary language: your choice
- Bundle ID: `xyz.yuezhihui.application`
- SKU: any unique internal value, for example `yuezhihui-ios-001`

### 2. Confirm Apple Developer signing

In Xcode:

1. Open `ios/Runner.xcworkspace`
2. Select target `Runner`
3. Open `Signing & Capabilities`
4. Confirm `Automatically manage signing` is enabled
5. Confirm Team is the correct Apple Developer team
6. Confirm Bundle Identifier is `xyz.yuezhihui.application`

### 3. Create the Xcode Cloud workflow

In Xcode:

1. `Product` -> `Xcode Cloud` -> `Create Workflow`
2. Select app `Runner`
3. Use scheme `Runner`
4. Distribution:
   - For internal testing: `TestFlight Internal Only`
   - For external/App Store flow: `TestFlight`
5. Branch trigger:
   - Recommended branch: your main release branch
6. Files and folders condition:
   - `lib/**`
   - `ios/**`
   - `pubspec.yaml`
   - `pubspec.lock`

### 4. Set the initial Xcode Cloud build number

If App Store Connect already has a higher build number than `1`, set `Next Build Number` in the workflow to a value higher than the latest uploaded build.

### 5. Fill App Store Connect metadata

Before App Review / App Store submission, you still need:

- App name
- Subtitle
- Description
- Keywords
- Privacy Policy URL
- Support URL
- Marketing URL optional
- App icon
- Screenshots for required device sizes
- Age rating
- App privacy questionnaire
- Export compliance

### 6. First archive check locally

Before trusting cloud delivery, validate locally:

```sh
cd female_menstrual_record_819e28/apps/flutter_app
flutter build ipa
```

## Notes

- The current iOS display name in `ios/Runner/Info.plist` is `月知会`.
- The current iOS bundle display name and branding should be updated before submission if this is not your final product name.
- Xcode Cloud setup in this repo does not by itself create the workflow in Apple's backend. That step must be completed in Xcode while logged into the correct Apple account.
