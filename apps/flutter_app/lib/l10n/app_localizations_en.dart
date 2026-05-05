// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Yuezhihui';

  @override
  String get brandName => 'FlowCycle';

  @override
  String get brandTagline => 'Email sign-in, onboarding, and daily tracking.';

  @override
  String get connecting => 'Connecting...';

  @override
  String get continueAction => 'Continue';

  @override
  String get login => 'Sign in';

  @override
  String get logout => 'Sign out';

  @override
  String get email => 'Email';

  @override
  String get emailPlaceholder => 'name@example.com';

  @override
  String get sendCode => 'Send code';

  @override
  String get verificationCode => 'Verification code';

  @override
  String get verifyAndLogin => 'Verify and sign in';

  @override
  String get resendCode => 'Resend';

  @override
  String get codeSentHint => 'A code has been sent to this email.';

  @override
  String get marketingHint => 'We do not send marketing email.';

  @override
  String get invalidEmail => 'Enter a valid email address.';

  @override
  String get invalidCode => 'Enter the 6-digit code.';

  @override
  String get loadFailed => 'Unable to load. Please try again.';

  @override
  String get homeTab => 'Daily';

  @override
  String get analysisTab => 'Analysis';

  @override
  String get settingsTab => 'Settings';

  @override
  String get homeTitle => 'Daily Tracking';

  @override
  String get homeSubtitle =>
      'Keeps the light card layout and soft background from the Taro app.';

  @override
  String get openOnboarding => 'Continue onboarding';

  @override
  String get viewAnalysis => 'View analysis';

  @override
  String get todaySummary => 'Today';

  @override
  String get signedInAs => 'Signed in as';

  @override
  String get analysisTitle => 'Analysis';

  @override
  String get analysisSubtitle =>
      'Records are grouped into cycles with trend and risk hints.';

  @override
  String get startAnalysis => 'Start analysis';

  @override
  String get healthScore => 'Health score';

  @override
  String get cycleCount => 'Cycle count';

  @override
  String get trend => 'Trend';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get settingsSubtitle => 'Account, language, and basic preferences.';

  @override
  String get language => 'Language';

  @override
  String get languageSystem => 'System';

  @override
  String get languageZh => 'Chinese';

  @override
  String get languageEn => 'English';

  @override
  String get apiBaseUrl => 'API base URL';

  @override
  String get copyTokenHint =>
      'The Flutter client uses Bearer token auth and does not rely on cookies.';

  @override
  String get loggedOut => 'Signed out';

  @override
  String get onboardingTitle => 'Onboarding';

  @override
  String get onboardingSubtitle =>
      'The repository already has full onboarding APIs. Flutter keeps a placeholder page first, then can follow the Taro flow.';

  @override
  String get goToHome => 'Go to home';

  @override
  String get unknown => 'Not set';

  @override
  String get authenticated => 'Signed in';

  @override
  String get notAuthenticated => 'Signed out';

  @override
  String get useTampon => 'Enable tampon module';

  @override
  String get refresh => 'Refresh';

  @override
  String get loading => 'Loading...';

  @override
  String get retry => 'Retry';
}
