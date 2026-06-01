// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'FlowSense';

  @override
  String get brandName => 'FlowSense';

  @override
  String get brandWordmark => 'FLOWSENSE';

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
  String get verifyEmail => 'Verify email';

  @override
  String get enterEmail => 'Enter email';

  @override
  String get editEmail => 'Edit';

  @override
  String get clearEmail => 'Clear email';

  @override
  String get enterCode => 'Enter verification code';

  @override
  String get codePlaceholder => 'Enter the 6-digit code';

  @override
  String get pasteCode => 'Paste code';

  @override
  String get resendAvailable => 'You can resend the code';

  @override
  String resendCountdown(int seconds) {
    return 'Resend in ${seconds}s';
  }

  @override
  String get devCode => 'Development verification code';

  @override
  String get codeCopied => 'Verification code copied';

  @override
  String get copyCode => 'Copy code';

  @override
  String get fillAndLogin => 'Fill and sign in';

  @override
  String get browseEncyclopedia => 'Browse encyclopedia';

  @override
  String get codeResent => 'A new verification code has been sent';

  @override
  String get clipboardCodeMissing =>
      'The clipboard does not contain a 6-digit code';

  @override
  String get emailCodeLogin => 'Sign in with email code';

  @override
  String get codeSentDescription =>
      'A 6-digit verification code has been sent to your email.';

  @override
  String get verificationStep => 'Verify';

  @override
  String get sendCodeFailed =>
      'Unable to send the verification code. Please try again.';

  @override
  String get invalidOrExpiredCode =>
      'The verification code is invalid or has expired.';

  @override
  String get loginFailed => 'Unable to sign in. Please try again.';

  @override
  String get unexpectedError => 'Something went wrong. Please try again.';

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
  String get encyclopediaTab => 'Encyclopedia';

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
  String get settingsSubtitle => 'Account, privacy, and tracking preferences.';

  @override
  String get signedInAccount => 'Signed-in account';

  @override
  String get accountSection => 'Account';

  @override
  String get privacyLanguageSection => 'Privacy and language';

  @override
  String get recordDisplaySection => 'Tracking display';

  @override
  String get supportFeedbackSection => 'Support and feedback';

  @override
  String get nickname => 'Nickname';

  @override
  String get nicknameSaved => 'Nickname saved';

  @override
  String get saving => 'Saving...';

  @override
  String get saveNickname => 'Save nickname';

  @override
  String get tamponHabit => 'I use tampons';

  @override
  String get tamponHabitHint =>
      'Syncs your account and controls whether tampon tracking appears on the home page';

  @override
  String get showTamponRecords => 'Show tampon tracking';

  @override
  String get hideTamponRecords => 'Hide tampon tracking';

  @override
  String researchConsent(Object status) {
    return 'Research consent: $status';
  }

  @override
  String researchConsentStatus(Object status) {
    return 'Research consent status: $status';
  }

  @override
  String get consentAgreed => 'Agreed';

  @override
  String get consentDeclined => 'Declined';

  @override
  String get consentNotSet => 'Not set';

  @override
  String get consentUnavailable => 'Unavailable';

  @override
  String get editResearchConsent => 'Edit research consent';

  @override
  String get savingPreferences => 'Saving preferences...';

  @override
  String get preferencesSaveFailed =>
      'Unable to save. Previous settings restored.';

  @override
  String get displaySettingsSaved => 'Display settings saved';

  @override
  String get inputModeSaved => 'Input method saved';

  @override
  String get showPadModule => 'Show sanitary pad module';

  @override
  String get showPadModuleHint =>
      'Only affects the home page display, not saved records';

  @override
  String get showRealtimeBleeding => 'Show real-time bleeding volume';

  @override
  String get showRealtimeBleedingHint =>
      'Hides the summary only, without affecting records or analysis';

  @override
  String get inputMode => 'Input mode';

  @override
  String get inputModeHint =>
      'Precision mode uses a slider to control bleeding volume. Quick mode uses tap-to-add buttons.';

  @override
  String get padPrecisionMode => 'Sanitary pad precision mode';

  @override
  String get tamponPrecisionMode => 'Tampon precision mode';

  @override
  String get dragSliderInput => 'Drag the slider to record';

  @override
  String get quickButtonInput => 'Tap a button to add quickly';

  @override
  String get padPrecisionPreview => 'Sanitary pad precision mode preview';

  @override
  String get tamponPrecisionPreview => 'Tampon precision mode preview';

  @override
  String get previewSpecifications => 'View specifications and volume preview';

  @override
  String get previewTamponHeight => 'View model and saturation height preview';

  @override
  String get previewEnabledEffect => 'Preview the enabled mode';

  @override
  String get padPreviewTitle => 'Sanitary pad · Precision mode preview';

  @override
  String get tamponPreviewTitle => 'Tampon · Precision mode preview';

  @override
  String get precisionEnabledCaption =>
      'Precision input is enabled. The home page uses the same specification and slider controls.';

  @override
  String get tamponPrecisionEnabledCaption =>
      'Precision input is enabled. Saturation height changes with bleeding volume.';

  @override
  String get quickModeCaption =>
      'Quick mode is active. Enable precision mode to use slider input on the home page.';

  @override
  String get padUnit => 'mL / pad';

  @override
  String get tamponUnit => 'mL / tampon';

  @override
  String get padLiner => 'Liner';

  @override
  String get padDay => 'Day';

  @override
  String get padNight => 'Night';

  @override
  String get padPants => 'Period underwear';

  @override
  String get tamponMini => 'Mini';

  @override
  String get tamponRegular => 'Regular';

  @override
  String get tamponLarge => 'Large';

  @override
  String get tamponSuper => 'Super';

  @override
  String get pad => 'Sanitary pad';

  @override
  String get tampon => 'Tampon';

  @override
  String bleedingVolume(Object volume) {
    return 'Volume $volume';
  }

  @override
  String get volumeLow => 'Low';

  @override
  String get volumeMedium => 'Medium';

  @override
  String get volumeHigh => 'High';

  @override
  String get preview => 'Preview';

  @override
  String get done => 'Done';

  @override
  String get submitFeedback => 'Submit feedback';

  @override
  String get deleteAccount => 'Delete account';

  @override
  String get deleteAccountDescription =>
      'Deleting your account signs you out immediately. Registering again with the same email creates a new account and does not restore current data.';

  @override
  String get confirmCurrentEmail =>
      'Enter your current email to confirm deletion:';

  @override
  String get confirmEmail => 'Confirm email';

  @override
  String get deletingAccountState =>
      'Deleting your account and clearing the current session...';

  @override
  String get cancel => 'Cancel';

  @override
  String get deleting => 'Deleting...';

  @override
  String get confirmDelete => 'Confirm deletion';

  @override
  String get confirmDeleteEmailError =>
      'Enter the current signed-in email to confirm deletion';

  @override
  String get accountDeleted =>
      'Account deleted. Registering again creates a new account.';

  @override
  String get guestBanner =>
      'Guest mode: encyclopedia content is available, but tracking and analysis require sign-in.';

  @override
  String get goToLogin => 'Sign in';

  @override
  String get continueAfterLogin => 'Continue after signing in';

  @override
  String get loginRequired => 'Sign in to use this feature.';

  @override
  String get loginBenefitDescription =>
      'Sign in to save daily records, view analysis, and sync data across devices.';

  @override
  String get loginBenefitRecords => 'Keep your records safe';

  @override
  String get loginBenefitAnalysis => 'Generate cycle analysis automatically';

  @override
  String get loginBenefitSync => 'Sync across devices';

  @override
  String get browseFirst => 'Browse first';

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

  @override
  String get guestGateTitle => 'Sign-in required';

  @override
  String get guestGateDescription =>
      'Encyclopedia content is public. Tracking, analysis, and settings require sign-in.';

  @override
  String get backToEncyclopedia => 'Back to encyclopedia';

  @override
  String get feedbackTitle => 'Feedback';

  @override
  String get feedbackType => 'Issue type';

  @override
  String get feedbackBug => 'Bug';

  @override
  String get feedbackExperience => 'Usability';

  @override
  String get feedbackFeature => 'Feature request';

  @override
  String get feedbackContent => 'Content';

  @override
  String get feedbackOther => 'Other';

  @override
  String get feedbackSubmitted => 'Submitted';

  @override
  String get feedbackDraftRestored => 'Previous draft restored';

  @override
  String get feedbackDraftHint => 'Draft saves automatically';

  @override
  String feedbackDraftSaved(Object time) {
    return 'Draft saved $time';
  }

  @override
  String get feedbackDescription => 'Description';

  @override
  String get feedbackDescriptionHint =>
      'Describe what you did, expected, and saw';

  @override
  String get feedbackSpecificHint => 'Specific details help us investigate';

  @override
  String get feedbackMinimumHint => 'Enter at least 5 characters';

  @override
  String get feedbackContact => 'Contact (optional)';

  @override
  String get feedbackContactHint => 'Email / WeChat / phone';

  @override
  String get submitting => 'Submitting...';

  @override
  String get cycleDetail => 'Cycle details';

  @override
  String get cycleShareCopied => 'Cycle share path copied';

  @override
  String get cycleSummaryCopied => 'Cycle summary copied';

  @override
  String get copyCycleSummary => 'Copy cycle summary';

  @override
  String get explanationLinkCopied => 'Explanation link copied';

  @override
  String get dailyDetails => 'Daily details';

  @override
  String get noBleedingDays => 'No bleeding days recorded for this cycle.';

  @override
  String get productSettlement => 'Product summary';

  @override
  String get cycleLoadFailed => 'Unable to load cycle details';

  @override
  String daysAndVolume(Object days, Object volume) {
    return '$days days · ${volume}mL';
  }

  @override
  String dayDetails(Object clot, Object color, Object symptoms) {
    return 'Color $color · clots $clot · symptoms $symptoms';
  }

  @override
  String get notRecorded => 'Not recorded';

  @override
  String get level => 'Level';

  @override
  String get distribution => 'Distribution';

  @override
  String get color => 'Color';

  @override
  String get clot => 'Clots';

  @override
  String get distributionAbnormal => 'Distribution flagged';

  @override
  String get colorAbnormal => 'Color flagged';

  @override
  String get clotAbnormal => 'Clots flagged';

  @override
  String get trendStable => 'Overall trend is stable';

  @override
  String summaryHighlights(Object highlights) {
    return 'Highlights: $highlights';
  }

  @override
  String get encyclopediaTitle => 'Encyclopedia';

  @override
  String get encyclopediaSubtitle => 'Understand volume, risk, and changes.';

  @override
  String get encyclopediaNote => 'HEALTH NOTE';

  @override
  String get encyclopediaHeroTitle => 'Make menstrual volume clear';

  @override
  String get encyclopediaHeroBody =>
      'Volume is not just a feeling. It is a measurable health signal.';

  @override
  String get copiedLink => 'Link copied';

  @override
  String get collapse => 'Collapse';

  @override
  String get expand => 'Expand';

  @override
  String get keyPoints => 'Key points';

  @override
  String get redFlags => 'Red flags';

  @override
  String get kbVitalTag => 'Tracking';

  @override
  String get kbVitalTitle => 'Menstruation is a vital sign';

  @override
  String get kbVitalLead =>
      'Cycle timing, volume, color, pain, and bleeding patterns all carry signals.';

  @override
  String get kbVitalBody1 =>
      'Treat each period as a monthly health snapshot to spot heavy bleeding, anemia risk, or persistent pain earlier.';

  @override
  String get kbVitalBody2 =>
      'Consistent records turn vague symptoms into comparable data you can discuss with a clinician.';

  @override
  String get kbVitalBullet1 => 'Track changes for clarity, not anxiety';

  @override
  String get kbVitalBullet2 => 'Patterns matter more than a single unusual day';

  @override
  String get kbVitalBullet3 => 'Clear descriptions support better decisions';

  @override
  String get kbNormalTag => 'Basics';

  @override
  String get kbNormalTitle => 'Know the usual range to spot changes';

  @override
  String get kbNormalLead => 'A period is more than whether it arrives.';

  @override
  String get kbNormalBody =>
      'Review timing, duration, volume, clots, color, and pain together. Sudden changes deserve attention.';

  @override
  String get kbNormalBullet1 =>
      'Cycles of 21-35 days are common; your own pattern matters';

  @override
  String get kbNormalBullet2 =>
      'Periods often last 3-8 days; heavy bleeding beyond 7 days needs attention';

  @override
  String get kbNormalBullet3 =>
      '20-80mL per cycle is common; much more may signal risk';

  @override
  String get kbNormalBullet4 =>
      'Frequent large clots, fatigue, dizziness, or overnight leaks are worth recording';

  @override
  String get kbRiskTag => 'Risk';

  @override
  String get kbRiskTitle => 'Heavy bleeding is easy to overlook';

  @override
  String get kbRiskLead =>
      'Heavy flow is not a sign of better health and should not be ignored.';

  @override
  String get kbRiskBody =>
      'Pay attention if products need frequent changing, sleep or work is disrupted, or fatigue and dizziness appear.';

  @override
  String get kbRiskFlag1 =>
      'Soaking a pad or tampon every hour for several hours';

  @override
  String get kbRiskFlag2 =>
      'Changing products overnight or combining multiple products';

  @override
  String get kbRiskFlag3 => 'Bleeding beyond 7 days that disrupts daily life';

  @override
  String get kbRiskFlag4 =>
      'Fatigue, dizziness, palpitations, or shortness of breath';

  @override
  String get kbTrackTag => 'Checklist';

  @override
  String get kbTrackTitle => 'Track 6 useful dimensions';

  @override
  String get kbTrackLead => 'A small, consistent set of records is enough.';

  @override
  String get kbTrackBody =>
      'These dimensions support trend analysis and risk prompts.';

  @override
  String get kbTrackBullet1 => 'Start date, end date, and duration';

  @override
  String get kbTrackBullet2 => 'Daily volume or product-change frequency';

  @override
  String get kbTrackBullet3 => 'Color and clots';

  @override
  String get kbTrackBullet4 => 'Pain level and medication use';

  @override
  String get kbTrackBullet5 => 'Bleeding outside the period';

  @override
  String get kbTrackBullet6 => 'Energy and sleep changes';

  @override
  String get homeSubtitleActive => 'Track daily. Drafts save automatically.';

  @override
  String get firstDayGuide =>
      'Jumped to your latest start date. Record this day first.';

  @override
  String get earliestDateReached => 'Earliest date reached';

  @override
  String get todayReached => 'Already on today';

  @override
  String deletedEvent(Object target) {
    return 'Deleted $target';
  }

  @override
  String get undo => 'Undo';

  @override
  String get editEvent => 'Edit event';

  @override
  String get padType => 'Pad type';

  @override
  String get tamponModel => 'Tampon model';

  @override
  String get clotType => 'Clot type';

  @override
  String get smallClot => 'Small clot';

  @override
  String get largeClot => 'Large clot';

  @override
  String get delete => 'Delete';

  @override
  String get saveChanges => 'Save changes';

  @override
  String get recordSaved => 'Record saved';

  @override
  String get recordSaveFailedDraftKept =>
      'Unable to submit. Changes remain in your local draft.';

  @override
  String get recentDays => 'Last 14 days';

  @override
  String get dateStripHint =>
      'Tap a date to switch. Dots show color; numbers show volume.';

  @override
  String get previousDay => 'Previous day';

  @override
  String get nextDay => 'Next day';

  @override
  String get today => 'Today';

  @override
  String get switching => 'Switching';

  @override
  String get todayLimit => 'Today reached';

  @override
  String get markColorAndClots => 'Mark color and clots';

  @override
  String get colorAndSymptoms => 'Color and symptoms';

  @override
  String get addSmallClot => '+ Small clot';

  @override
  String get addLargeClot => '+ Large clot';

  @override
  String get recordedItems => 'Recorded items';

  @override
  String get todayRecords => 'Today\'s records';

  @override
  String get noRecordsToday => 'No records yet today.';

  @override
  String get saveRecord => 'Save record';

  @override
  String get synced => 'Synced';

  @override
  String symptomEvent(Object name) {
    return 'Symptom · $name';
  }

  @override
  String padEvent(Object type, Object volume) {
    return 'Pad · $type · ${volume}mL';
  }

  @override
  String tamponEvent(Object model, Object volume) {
    return 'Tampon · $model · ${volume}mL';
  }

  @override
  String quotedEvent(Object name) {
    return '\"$name\"';
  }

  @override
  String get symptom => 'Symptom';

  @override
  String get padRecord => 'Pad record';

  @override
  String get tamponRecord => 'Tampon record';

  @override
  String get colorPink => 'Pink';

  @override
  String get colorRed => 'Red';

  @override
  String get colorRust => 'Rust';

  @override
  String get colorDark => 'Dark red';

  @override
  String get colorBrown => 'Brown';

  @override
  String get draftPending => 'Draft pending';

  @override
  String todayTotal(Object volume) {
    return 'Today\'s total ${volume}mL';
  }

  @override
  String get realtimeVolumeHidden => 'Real-time volume hidden';

  @override
  String get clotEstimate => 'Clot estimate';

  @override
  String get syncing => 'Syncing';

  @override
  String draftSavedAt(Object time) {
    return 'Draft saved $time';
  }

  @override
  String syncedAt(Object time) {
    return 'Synced $time';
  }

  @override
  String get cloudRecord => 'Cloud record';

  @override
  String get quickInput => 'Quick add';

  @override
  String get additionalInput => 'Add more';

  @override
  String get precisionInputHint => 'Drag to choose a precise mL value.';

  @override
  String get quickInputHint => 'Tap a preset to add quickly.';

  @override
  String addVolume(Object volume) {
    return 'Add ${volume}mL';
  }

  @override
  String get tapToAdd => 'Tap to add';

  @override
  String get reviewBeforeSubmit => 'Review before submitting';

  @override
  String get submitAndStart => 'Submit and start tracking';

  @override
  String completedProgress(Object current, Object total) {
    return 'Completed $current/$total';
  }

  @override
  String get previousQuestion => 'Previous';

  @override
  String get skip => 'Skip';

  @override
  String get nextQuestion => 'Next';

  @override
  String get submittingShort => 'Submitting';

  @override
  String get searchAndSelect => 'Search and select';

  @override
  String get uncertain => 'Not sure';

  @override
  String get uncertainOrForgot => 'Not sure / cannot recall';

  @override
  String get preferNotToSay => 'Prefer not to say';

  @override
  String get selectDate => 'Select date';

  @override
  String get exactDate => 'Exact date';

  @override
  String get yearMonthOnly => 'Year and month only';

  @override
  String get year => 'Year';

  @override
  String get month => 'Month';

  @override
  String get analysisSubtitleActive => 'Review risks and cycle changes.';

  @override
  String loadFailedWithError(Object error) {
    return 'Unable to load: $error';
  }

  @override
  String get priorityRisks => 'Priority risks';

  @override
  String get allCycles => 'All cycles';

  @override
  String get cycles => 'Cycles';

  @override
  String get noCycles => 'No cycles available for analysis yet.';

  @override
  String get moreCycles => 'More cycles';

  @override
  String get riskLinkCopied => 'Reference link copied';

  @override
  String get sharing => 'Sharing...';

  @override
  String get share => 'Share';

  @override
  String get scoreUnit => 'pts';

  @override
  String get regularity => 'Regularity';

  @override
  String get recentCycle => 'Recent cycle';

  @override
  String cycleTimelineItem(
    Object days,
    Object interval,
    Object start,
    Object volume,
  ) {
    return '$start · $days days · ${volume}mL$interval';
  }

  @override
  String cycleInterval(Object days) {
    return ' · $days-day interval';
  }

  @override
  String get sourceAcogVital => 'ACOG: Menstrual cycle as a vital sign';

  @override
  String get sourceMayoCycle => 'Mayo Clinic: Menstrual cycle basics';

  @override
  String get sourceCdcHeavy => 'CDC: Heavy menstrual bleeding';

  @override
  String get sourceNhsHeavy => 'NHS: Heavy periods';

  @override
  String get sourceMayoHeavy => 'Mayo Clinic: Heavy menstrual bleeding';

  @override
  String get sourceWhoEndometriosis => 'WHO: Endometriosis';
}
