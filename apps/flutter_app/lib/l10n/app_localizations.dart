import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In zh, this message translates to:
  /// **'月知会'**
  String get appTitle;

  /// No description provided for @brandName.
  ///
  /// In zh, this message translates to:
  /// **'月知会'**
  String get brandName;

  /// No description provided for @brandWordmark.
  ///
  /// In zh, this message translates to:
  /// **'FLOWSENSE'**
  String get brandWordmark;

  /// No description provided for @brandTagline.
  ///
  /// In zh, this message translates to:
  /// **'邮箱验证码登录，继续引导，开始按日记录。'**
  String get brandTagline;

  /// No description provided for @connecting.
  ///
  /// In zh, this message translates to:
  /// **'正在连接服务...'**
  String get connecting;

  /// No description provided for @continueAction.
  ///
  /// In zh, this message translates to:
  /// **'继续'**
  String get continueAction;

  /// No description provided for @login.
  ///
  /// In zh, this message translates to:
  /// **'登录'**
  String get login;

  /// No description provided for @logout.
  ///
  /// In zh, this message translates to:
  /// **'退出登录'**
  String get logout;

  /// No description provided for @email.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get email;

  /// No description provided for @emailPlaceholder.
  ///
  /// In zh, this message translates to:
  /// **'name@example.com'**
  String get emailPlaceholder;

  /// No description provided for @sendCode.
  ///
  /// In zh, this message translates to:
  /// **'发送验证码'**
  String get sendCode;

  /// No description provided for @verificationCode.
  ///
  /// In zh, this message translates to:
  /// **'验证码'**
  String get verificationCode;

  /// No description provided for @verifyAndLogin.
  ///
  /// In zh, this message translates to:
  /// **'验证并登录'**
  String get verifyAndLogin;

  /// No description provided for @resendCode.
  ///
  /// In zh, this message translates to:
  /// **'重新发送'**
  String get resendCode;

  /// No description provided for @verifyEmail.
  ///
  /// In zh, this message translates to:
  /// **'验证邮箱'**
  String get verifyEmail;

  /// No description provided for @enterEmail.
  ///
  /// In zh, this message translates to:
  /// **'输入邮箱'**
  String get enterEmail;

  /// No description provided for @editEmail.
  ///
  /// In zh, this message translates to:
  /// **'修改'**
  String get editEmail;

  /// No description provided for @clearEmail.
  ///
  /// In zh, this message translates to:
  /// **'清空邮箱'**
  String get clearEmail;

  /// No description provided for @enterCode.
  ///
  /// In zh, this message translates to:
  /// **'输入验证码'**
  String get enterCode;

  /// No description provided for @codePlaceholder.
  ///
  /// In zh, this message translates to:
  /// **'输入 6 位数字'**
  String get codePlaceholder;

  /// No description provided for @pasteCode.
  ///
  /// In zh, this message translates to:
  /// **'粘贴验证码'**
  String get pasteCode;

  /// No description provided for @resendAvailable.
  ///
  /// In zh, this message translates to:
  /// **'可重新发送'**
  String get resendAvailable;

  /// No description provided for @resendCountdown.
  ///
  /// In zh, this message translates to:
  /// **'{seconds}s 后可重发'**
  String resendCountdown(int seconds);

  /// No description provided for @devCode.
  ///
  /// In zh, this message translates to:
  /// **'开发环境验证码'**
  String get devCode;

  /// No description provided for @codeCopied.
  ///
  /// In zh, this message translates to:
  /// **'验证码已复制'**
  String get codeCopied;

  /// No description provided for @copyCode.
  ///
  /// In zh, this message translates to:
  /// **'复制验证码'**
  String get copyCode;

  /// No description provided for @fillAndLogin.
  ///
  /// In zh, this message translates to:
  /// **'填入并登录'**
  String get fillAndLogin;

  /// No description provided for @browseEncyclopedia.
  ///
  /// In zh, this message translates to:
  /// **'浏览百科'**
  String get browseEncyclopedia;

  /// No description provided for @codeResent.
  ///
  /// In zh, this message translates to:
  /// **'验证码已重新发送'**
  String get codeResent;

  /// No description provided for @clipboardCodeMissing.
  ///
  /// In zh, this message translates to:
  /// **'剪贴板里没有 6 位验证码'**
  String get clipboardCodeMissing;

  /// No description provided for @emailCodeLogin.
  ///
  /// In zh, this message translates to:
  /// **'邮箱验证码登录'**
  String get emailCodeLogin;

  /// No description provided for @codeSentDescription.
  ///
  /// In zh, this message translates to:
  /// **'6 位数字验证码已发送到邮箱。'**
  String get codeSentDescription;

  /// No description provided for @verificationStep.
  ///
  /// In zh, this message translates to:
  /// **'验证'**
  String get verificationStep;

  /// No description provided for @sendCodeFailed.
  ///
  /// In zh, this message translates to:
  /// **'验证码发送失败，请稍后重试'**
  String get sendCodeFailed;

  /// No description provided for @invalidOrExpiredCode.
  ///
  /// In zh, this message translates to:
  /// **'验证码无效或已过期'**
  String get invalidOrExpiredCode;

  /// No description provided for @loginFailed.
  ///
  /// In zh, this message translates to:
  /// **'登录失败，请稍后重试'**
  String get loginFailed;

  /// No description provided for @unexpectedError.
  ///
  /// In zh, this message translates to:
  /// **'发生未知错误，请稍后重试'**
  String get unexpectedError;

  /// No description provided for @codeSentHint.
  ///
  /// In zh, this message translates to:
  /// **'验证码已发送到该邮箱'**
  String get codeSentHint;

  /// No description provided for @marketingHint.
  ///
  /// In zh, this message translates to:
  /// **'我们不会发送营销邮件'**
  String get marketingHint;

  /// No description provided for @invalidEmail.
  ///
  /// In zh, this message translates to:
  /// **'请输入正确邮箱'**
  String get invalidEmail;

  /// No description provided for @invalidCode.
  ///
  /// In zh, this message translates to:
  /// **'请输入 6 位验证码'**
  String get invalidCode;

  /// No description provided for @loadFailed.
  ///
  /// In zh, this message translates to:
  /// **'加载失败，请稍后重试'**
  String get loadFailed;

  /// No description provided for @homeTab.
  ///
  /// In zh, this message translates to:
  /// **'每日'**
  String get homeTab;

  /// No description provided for @analysisTab.
  ///
  /// In zh, this message translates to:
  /// **'分析'**
  String get analysisTab;

  /// No description provided for @encyclopediaTab.
  ///
  /// In zh, this message translates to:
  /// **'百科'**
  String get encyclopediaTab;

  /// No description provided for @settingsTab.
  ///
  /// In zh, this message translates to:
  /// **'设置'**
  String get settingsTab;

  /// No description provided for @homeTitle.
  ///
  /// In zh, this message translates to:
  /// **'每日记录'**
  String get homeTitle;

  /// No description provided for @homeSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'参考现有 Taro 设计，保留轻量卡片和柔和底色。'**
  String get homeSubtitle;

  /// No description provided for @openOnboarding.
  ///
  /// In zh, this message translates to:
  /// **'继续问卷'**
  String get openOnboarding;

  /// No description provided for @viewAnalysis.
  ///
  /// In zh, this message translates to:
  /// **'查看分析'**
  String get viewAnalysis;

  /// No description provided for @todaySummary.
  ///
  /// In zh, this message translates to:
  /// **'今日状态'**
  String get todaySummary;

  /// No description provided for @signedInAs.
  ///
  /// In zh, this message translates to:
  /// **'当前账号'**
  String get signedInAs;

  /// No description provided for @analysisTitle.
  ///
  /// In zh, this message translates to:
  /// **'分析'**
  String get analysisTitle;

  /// No description provided for @analysisSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'记录会自动汇总为周期，并生成趋势与风险提示。'**
  String get analysisSubtitle;

  /// No description provided for @startAnalysis.
  ///
  /// In zh, this message translates to:
  /// **'开始分析'**
  String get startAnalysis;

  /// No description provided for @healthScore.
  ///
  /// In zh, this message translates to:
  /// **'健康分'**
  String get healthScore;

  /// No description provided for @cycleCount.
  ///
  /// In zh, this message translates to:
  /// **'周期数'**
  String get cycleCount;

  /// No description provided for @trend.
  ///
  /// In zh, this message translates to:
  /// **'趋势'**
  String get trend;

  /// No description provided for @settingsTitle.
  ///
  /// In zh, this message translates to:
  /// **'设置'**
  String get settingsTitle;

  /// No description provided for @settingsSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'账号、隐私和记录偏好。'**
  String get settingsSubtitle;

  /// No description provided for @signedInAccount.
  ///
  /// In zh, this message translates to:
  /// **'已登录账户'**
  String get signedInAccount;

  /// No description provided for @accountSection.
  ///
  /// In zh, this message translates to:
  /// **'账号'**
  String get accountSection;

  /// No description provided for @privacyLanguageSection.
  ///
  /// In zh, this message translates to:
  /// **'隐私与语言'**
  String get privacyLanguageSection;

  /// No description provided for @recordDisplaySection.
  ///
  /// In zh, this message translates to:
  /// **'记录展示'**
  String get recordDisplaySection;

  /// No description provided for @supportFeedbackSection.
  ///
  /// In zh, this message translates to:
  /// **'支持与反馈'**
  String get supportFeedbackSection;

  /// No description provided for @nickname.
  ///
  /// In zh, this message translates to:
  /// **'昵称'**
  String get nickname;

  /// No description provided for @nicknameSaved.
  ///
  /// In zh, this message translates to:
  /// **'昵称已保存'**
  String get nicknameSaved;

  /// No description provided for @saving.
  ///
  /// In zh, this message translates to:
  /// **'保存中...'**
  String get saving;

  /// No description provided for @saveNickname.
  ///
  /// In zh, this message translates to:
  /// **'保存昵称'**
  String get saveNickname;

  /// No description provided for @tamponHabit.
  ///
  /// In zh, this message translates to:
  /// **'我习惯用卫生棉条'**
  String get tamponHabit;

  /// No description provided for @tamponHabitHint.
  ///
  /// In zh, this message translates to:
  /// **'同步账号，并控制首页是否显示棉条'**
  String get tamponHabitHint;

  /// No description provided for @showTamponRecords.
  ///
  /// In zh, this message translates to:
  /// **'显示棉条记录'**
  String get showTamponRecords;

  /// No description provided for @hideTamponRecords.
  ///
  /// In zh, this message translates to:
  /// **'隐藏棉条记录'**
  String get hideTamponRecords;

  /// No description provided for @researchConsent.
  ///
  /// In zh, this message translates to:
  /// **'研究同意：{status}'**
  String researchConsent(Object status);

  /// No description provided for @researchConsentStatus.
  ///
  /// In zh, this message translates to:
  /// **'研究同意状态：{status}'**
  String researchConsentStatus(Object status);

  /// No description provided for @consentAgreed.
  ///
  /// In zh, this message translates to:
  /// **'已同意'**
  String get consentAgreed;

  /// No description provided for @consentDeclined.
  ///
  /// In zh, this message translates to:
  /// **'未同意'**
  String get consentDeclined;

  /// No description provided for @consentNotSet.
  ///
  /// In zh, this message translates to:
  /// **'未填写'**
  String get consentNotSet;

  /// No description provided for @consentUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'未读取'**
  String get consentUnavailable;

  /// No description provided for @editResearchConsent.
  ///
  /// In zh, this message translates to:
  /// **'修改研究同意'**
  String get editResearchConsent;

  /// No description provided for @savingPreferences.
  ///
  /// In zh, this message translates to:
  /// **'正在保存偏好...'**
  String get savingPreferences;

  /// No description provided for @preferencesSaveFailed.
  ///
  /// In zh, this message translates to:
  /// **'保存失败，已恢复上一次设置'**
  String get preferencesSaveFailed;

  /// No description provided for @displaySettingsSaved.
  ///
  /// In zh, this message translates to:
  /// **'显示设置已保存'**
  String get displaySettingsSaved;

  /// No description provided for @inputModeSaved.
  ///
  /// In zh, this message translates to:
  /// **'录入方式已保存'**
  String get inputModeSaved;

  /// No description provided for @showPadModule.
  ///
  /// In zh, this message translates to:
  /// **'显示卫生巾模块'**
  String get showPadModule;

  /// No description provided for @showPadModuleHint.
  ///
  /// In zh, this message translates to:
  /// **'只影响首页显示，不影响已记录数据'**
  String get showPadModuleHint;

  /// No description provided for @showRealtimeBleeding.
  ///
  /// In zh, this message translates to:
  /// **'显示实时血量'**
  String get showRealtimeBleeding;

  /// No description provided for @showRealtimeBleedingHint.
  ///
  /// In zh, this message translates to:
  /// **'关闭后只隐藏汇总，不影响记录和分析'**
  String get showRealtimeBleedingHint;

  /// No description provided for @inputMode.
  ///
  /// In zh, this message translates to:
  /// **'输入模式'**
  String get inputMode;

  /// No description provided for @inputModeHint.
  ///
  /// In zh, this message translates to:
  /// **'打开精确模式后，将采用拖拽滑杆的方式精确控制血量；关闭则使用点击快捷添加。'**
  String get inputModeHint;

  /// No description provided for @padPrecisionMode.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾精确模式'**
  String get padPrecisionMode;

  /// No description provided for @tamponPrecisionMode.
  ///
  /// In zh, this message translates to:
  /// **'棉条精确模式'**
  String get tamponPrecisionMode;

  /// No description provided for @dragSliderInput.
  ///
  /// In zh, this message translates to:
  /// **'拖动滑杆录入'**
  String get dragSliderInput;

  /// No description provided for @quickButtonInput.
  ///
  /// In zh, this message translates to:
  /// **'点按钮快速添加'**
  String get quickButtonInput;

  /// No description provided for @padPrecisionPreview.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾精确模式预览'**
  String get padPrecisionPreview;

  /// No description provided for @tamponPrecisionPreview.
  ///
  /// In zh, this message translates to:
  /// **'卫生棉条精确模式预览'**
  String get tamponPrecisionPreview;

  /// No description provided for @previewSpecifications.
  ///
  /// In zh, this message translates to:
  /// **'点击查看规格与血量预览'**
  String get previewSpecifications;

  /// No description provided for @previewTamponHeight.
  ///
  /// In zh, this message translates to:
  /// **'点击查看型号与浸润高度预览'**
  String get previewTamponHeight;

  /// No description provided for @previewEnabledEffect.
  ///
  /// In zh, this message translates to:
  /// **'点击预览开启后的效果'**
  String get previewEnabledEffect;

  /// No description provided for @padPreviewTitle.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾 · 精确模式预览'**
  String get padPreviewTitle;

  /// No description provided for @tamponPreviewTitle.
  ///
  /// In zh, this message translates to:
  /// **'卫生棉条 · 精确模式预览'**
  String get tamponPreviewTitle;

  /// No description provided for @precisionEnabledCaption.
  ///
  /// In zh, this message translates to:
  /// **'当前已开启精确录入，首页会显示同样的规格与滑杆逻辑。'**
  String get precisionEnabledCaption;

  /// No description provided for @tamponPrecisionEnabledCaption.
  ///
  /// In zh, this message translates to:
  /// **'当前已开启精确录入，浸润高度会随着血量变化。'**
  String get tamponPrecisionEnabledCaption;

  /// No description provided for @quickModeCaption.
  ///
  /// In zh, this message translates to:
  /// **'当前是快捷模式；开启后首页会切换成拖拽录入。'**
  String get quickModeCaption;

  /// No description provided for @padUnit.
  ///
  /// In zh, this message translates to:
  /// **'mL / 片'**
  String get padUnit;

  /// No description provided for @tamponUnit.
  ///
  /// In zh, this message translates to:
  /// **'mL / 条'**
  String get tamponUnit;

  /// No description provided for @padLiner.
  ///
  /// In zh, this message translates to:
  /// **'护垫'**
  String get padLiner;

  /// No description provided for @padDay.
  ///
  /// In zh, this message translates to:
  /// **'日用'**
  String get padDay;

  /// No description provided for @padNight.
  ///
  /// In zh, this message translates to:
  /// **'夜用'**
  String get padNight;

  /// No description provided for @padPants.
  ///
  /// In zh, this message translates to:
  /// **'安睡裤'**
  String get padPants;

  /// No description provided for @tamponMini.
  ///
  /// In zh, this message translates to:
  /// **'迷你'**
  String get tamponMini;

  /// No description provided for @tamponRegular.
  ///
  /// In zh, this message translates to:
  /// **'常规'**
  String get tamponRegular;

  /// No description provided for @tamponLarge.
  ///
  /// In zh, this message translates to:
  /// **'大号'**
  String get tamponLarge;

  /// No description provided for @tamponSuper.
  ///
  /// In zh, this message translates to:
  /// **'超大'**
  String get tamponSuper;

  /// No description provided for @pad.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾'**
  String get pad;

  /// No description provided for @tampon.
  ///
  /// In zh, this message translates to:
  /// **'卫生棉条'**
  String get tampon;

  /// No description provided for @bleedingVolume.
  ///
  /// In zh, this message translates to:
  /// **'血量 {volume}'**
  String bleedingVolume(Object volume);

  /// No description provided for @volumeLow.
  ///
  /// In zh, this message translates to:
  /// **'少'**
  String get volumeLow;

  /// No description provided for @volumeMedium.
  ///
  /// In zh, this message translates to:
  /// **'中'**
  String get volumeMedium;

  /// No description provided for @volumeHigh.
  ///
  /// In zh, this message translates to:
  /// **'多'**
  String get volumeHigh;

  /// No description provided for @preview.
  ///
  /// In zh, this message translates to:
  /// **'预览'**
  String get preview;

  /// No description provided for @done.
  ///
  /// In zh, this message translates to:
  /// **'完成'**
  String get done;

  /// No description provided for @submitFeedback.
  ///
  /// In zh, this message translates to:
  /// **'提交反馈'**
  String get submitFeedback;

  /// No description provided for @deleteAccount.
  ///
  /// In zh, this message translates to:
  /// **'删除账号'**
  String get deleteAccount;

  /// No description provided for @deleteAccountDescription.
  ///
  /// In zh, this message translates to:
  /// **'删除后会立即退出登录。后续若使用同一邮箱再次注册，系统会创建一个全新的账号，不会恢复当前数据。'**
  String get deleteAccountDescription;

  /// No description provided for @confirmCurrentEmail.
  ///
  /// In zh, this message translates to:
  /// **'请输入当前邮箱确认删除：'**
  String get confirmCurrentEmail;

  /// No description provided for @confirmEmail.
  ///
  /// In zh, this message translates to:
  /// **'确认邮箱'**
  String get confirmEmail;

  /// No description provided for @deletingAccountState.
  ///
  /// In zh, this message translates to:
  /// **'正在删除账号并清理当前登录状态...'**
  String get deletingAccountState;

  /// No description provided for @cancel.
  ///
  /// In zh, this message translates to:
  /// **'取消'**
  String get cancel;

  /// No description provided for @deleting.
  ///
  /// In zh, this message translates to:
  /// **'删除中...'**
  String get deleting;

  /// No description provided for @confirmDelete.
  ///
  /// In zh, this message translates to:
  /// **'确认删除'**
  String get confirmDelete;

  /// No description provided for @confirmDeleteEmailError.
  ///
  /// In zh, this message translates to:
  /// **'请输入当前登录邮箱以确认删除'**
  String get confirmDeleteEmailError;

  /// No description provided for @accountDeleted.
  ///
  /// In zh, this message translates to:
  /// **'账号已删除。重新注册将创建新账号。'**
  String get accountDeleted;

  /// No description provided for @guestBanner.
  ///
  /// In zh, this message translates to:
  /// **'当前是游客模式：百科可直接看，记录与分析需要登录。'**
  String get guestBanner;

  /// No description provided for @goToLogin.
  ///
  /// In zh, this message translates to:
  /// **'去登录'**
  String get goToLogin;

  /// No description provided for @continueAfterLogin.
  ///
  /// In zh, this message translates to:
  /// **'登录后继续'**
  String get continueAfterLogin;

  /// No description provided for @loginRequired.
  ///
  /// In zh, this message translates to:
  /// **'当前功能需要登录后使用。'**
  String get loginRequired;

  /// No description provided for @loginBenefitDescription.
  ///
  /// In zh, this message translates to:
  /// **'登录后可保存每日记录、查看分析结果，并在多端同步你的数据。'**
  String get loginBenefitDescription;

  /// No description provided for @loginBenefitRecords.
  ///
  /// In zh, this message translates to:
  /// **'保存记录，不怕丢失'**
  String get loginBenefitRecords;

  /// No description provided for @loginBenefitAnalysis.
  ///
  /// In zh, this message translates to:
  /// **'自动生成周期分析'**
  String get loginBenefitAnalysis;

  /// No description provided for @loginBenefitSync.
  ///
  /// In zh, this message translates to:
  /// **'支持后续多端同步'**
  String get loginBenefitSync;

  /// No description provided for @browseFirst.
  ///
  /// In zh, this message translates to:
  /// **'先看看'**
  String get browseFirst;

  /// No description provided for @language.
  ///
  /// In zh, this message translates to:
  /// **'语言'**
  String get language;

  /// No description provided for @languageSystem.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get languageSystem;

  /// No description provided for @languageZh.
  ///
  /// In zh, this message translates to:
  /// **'中文'**
  String get languageZh;

  /// No description provided for @languageEn.
  ///
  /// In zh, this message translates to:
  /// **'English'**
  String get languageEn;

  /// No description provided for @apiBaseUrl.
  ///
  /// In zh, this message translates to:
  /// **'接口地址'**
  String get apiBaseUrl;

  /// No description provided for @copyTokenHint.
  ///
  /// In zh, this message translates to:
  /// **'Flutter 客户端直接使用 Bearer Token，不依赖 Cookie。'**
  String get copyTokenHint;

  /// No description provided for @loggedOut.
  ///
  /// In zh, this message translates to:
  /// **'已退出登录'**
  String get loggedOut;

  /// No description provided for @onboardingTitle.
  ///
  /// In zh, this message translates to:
  /// **'问卷引导'**
  String get onboardingTitle;

  /// No description provided for @onboardingSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'当前仓库已具备完整问卷 API，Flutter 侧先保留占位页，下一步可以按 Taro 页面继续补齐。'**
  String get onboardingSubtitle;

  /// No description provided for @goToHome.
  ///
  /// In zh, this message translates to:
  /// **'进入主页'**
  String get goToHome;

  /// No description provided for @unknown.
  ///
  /// In zh, this message translates to:
  /// **'未填写'**
  String get unknown;

  /// No description provided for @authenticated.
  ///
  /// In zh, this message translates to:
  /// **'已登录'**
  String get authenticated;

  /// No description provided for @notAuthenticated.
  ///
  /// In zh, this message translates to:
  /// **'未登录'**
  String get notAuthenticated;

  /// No description provided for @useTampon.
  ///
  /// In zh, this message translates to:
  /// **'启用棉条模块'**
  String get useTampon;

  /// No description provided for @refresh.
  ///
  /// In zh, this message translates to:
  /// **'刷新'**
  String get refresh;

  /// No description provided for @loading.
  ///
  /// In zh, this message translates to:
  /// **'加载中...'**
  String get loading;

  /// No description provided for @retry.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get retry;

  /// No description provided for @guestGateTitle.
  ///
  /// In zh, this message translates to:
  /// **'该页面需要登录'**
  String get guestGateTitle;

  /// No description provided for @guestGateDescription.
  ///
  /// In zh, this message translates to:
  /// **'百科可直接浏览，记录、分析和设置需要登录。'**
  String get guestGateDescription;

  /// No description provided for @backToEncyclopedia.
  ///
  /// In zh, this message translates to:
  /// **'返回百科'**
  String get backToEncyclopedia;

  /// No description provided for @feedbackTitle.
  ///
  /// In zh, this message translates to:
  /// **'反馈'**
  String get feedbackTitle;

  /// No description provided for @feedbackType.
  ///
  /// In zh, this message translates to:
  /// **'问题类型'**
  String get feedbackType;

  /// No description provided for @feedbackBug.
  ///
  /// In zh, this message translates to:
  /// **'功能异常'**
  String get feedbackBug;

  /// No description provided for @feedbackExperience.
  ///
  /// In zh, this message translates to:
  /// **'体验问题'**
  String get feedbackExperience;

  /// No description provided for @feedbackFeature.
  ///
  /// In zh, this message translates to:
  /// **'功能建议'**
  String get feedbackFeature;

  /// No description provided for @feedbackContent.
  ///
  /// In zh, this message translates to:
  /// **'内容反馈'**
  String get feedbackContent;

  /// No description provided for @feedbackOther.
  ///
  /// In zh, this message translates to:
  /// **'其他'**
  String get feedbackOther;

  /// No description provided for @feedbackSubmitted.
  ///
  /// In zh, this message translates to:
  /// **'提交成功'**
  String get feedbackSubmitted;

  /// No description provided for @feedbackDraftRestored.
  ///
  /// In zh, this message translates to:
  /// **'已恢复上次内容'**
  String get feedbackDraftRestored;

  /// No description provided for @feedbackDraftHint.
  ///
  /// In zh, this message translates to:
  /// **'输入时自动保存草稿'**
  String get feedbackDraftHint;

  /// No description provided for @feedbackDraftSaved.
  ///
  /// In zh, this message translates to:
  /// **'草稿已保存 {time}'**
  String feedbackDraftSaved(Object time);

  /// No description provided for @feedbackDescription.
  ///
  /// In zh, this message translates to:
  /// **'问题描述'**
  String get feedbackDescription;

  /// No description provided for @feedbackDescriptionHint.
  ///
  /// In zh, this message translates to:
  /// **'请说明操作、预期和实际结果'**
  String get feedbackDescriptionHint;

  /// No description provided for @feedbackSpecificHint.
  ///
  /// In zh, this message translates to:
  /// **'越具体，越容易定位'**
  String get feedbackSpecificHint;

  /// No description provided for @feedbackMinimumHint.
  ///
  /// In zh, this message translates to:
  /// **'至少写 5 个字'**
  String get feedbackMinimumHint;

  /// No description provided for @feedbackContact.
  ///
  /// In zh, this message translates to:
  /// **'联系方式（可选）'**
  String get feedbackContact;

  /// No description provided for @feedbackContactHint.
  ///
  /// In zh, this message translates to:
  /// **'邮箱 / 微信 / 手机'**
  String get feedbackContactHint;

  /// No description provided for @submitting.
  ///
  /// In zh, this message translates to:
  /// **'提交中...'**
  String get submitting;

  /// No description provided for @cycleDetail.
  ///
  /// In zh, this message translates to:
  /// **'周期详情'**
  String get cycleDetail;

  /// No description provided for @cycleShareCopied.
  ///
  /// In zh, this message translates to:
  /// **'已复制周期分享路径'**
  String get cycleShareCopied;

  /// No description provided for @cycleSummaryCopied.
  ///
  /// In zh, this message translates to:
  /// **'已复制周期摘要'**
  String get cycleSummaryCopied;

  /// No description provided for @copyCycleSummary.
  ///
  /// In zh, this message translates to:
  /// **'复制周期摘要'**
  String get copyCycleSummary;

  /// No description provided for @explanationLinkCopied.
  ///
  /// In zh, this message translates to:
  /// **'已复制解释链接'**
  String get explanationLinkCopied;

  /// No description provided for @dailyDetails.
  ///
  /// In zh, this message translates to:
  /// **'日明细'**
  String get dailyDetails;

  /// No description provided for @noBleedingDays.
  ///
  /// In zh, this message translates to:
  /// **'该周期暂无出血日数据。'**
  String get noBleedingDays;

  /// No description provided for @productSettlement.
  ///
  /// In zh, this message translates to:
  /// **'用品结算'**
  String get productSettlement;

  /// No description provided for @cycleLoadFailed.
  ///
  /// In zh, this message translates to:
  /// **'周期详情加载失败'**
  String get cycleLoadFailed;

  /// No description provided for @daysAndVolume.
  ///
  /// In zh, this message translates to:
  /// **'{days}天 · {volume}mL'**
  String daysAndVolume(Object days, Object volume);

  /// No description provided for @dayDetails.
  ///
  /// In zh, this message translates to:
  /// **'颜色 {color} · 血块 {clot} · 症状 {symptoms}'**
  String dayDetails(Object clot, Object color, Object symptoms);

  /// No description provided for @notRecorded.
  ///
  /// In zh, this message translates to:
  /// **'未记录'**
  String get notRecorded;

  /// No description provided for @level.
  ///
  /// In zh, this message translates to:
  /// **'水平'**
  String get level;

  /// No description provided for @distribution.
  ///
  /// In zh, this message translates to:
  /// **'分布'**
  String get distribution;

  /// No description provided for @color.
  ///
  /// In zh, this message translates to:
  /// **'颜色'**
  String get color;

  /// No description provided for @clot.
  ///
  /// In zh, this message translates to:
  /// **'血块'**
  String get clot;

  /// No description provided for @distributionAbnormal.
  ///
  /// In zh, this message translates to:
  /// **'分布异常'**
  String get distributionAbnormal;

  /// No description provided for @colorAbnormal.
  ///
  /// In zh, this message translates to:
  /// **'颜色异常'**
  String get colorAbnormal;

  /// No description provided for @clotAbnormal.
  ///
  /// In zh, this message translates to:
  /// **'血块异常'**
  String get clotAbnormal;

  /// No description provided for @trendStable.
  ///
  /// In zh, this message translates to:
  /// **'整体趋势平稳'**
  String get trendStable;

  /// No description provided for @summaryHighlights.
  ///
  /// In zh, this message translates to:
  /// **'重点：{highlights}'**
  String summaryHighlights(Object highlights);

  /// No description provided for @encyclopediaTitle.
  ///
  /// In zh, this message translates to:
  /// **'百科'**
  String get encyclopediaTitle;

  /// No description provided for @encyclopediaSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'读懂经量、风险和变化。'**
  String get encyclopediaSubtitle;

  /// No description provided for @encyclopediaNote.
  ///
  /// In zh, this message translates to:
  /// **'健康笔记'**
  String get encyclopediaNote;

  /// No description provided for @encyclopediaHeroTitle.
  ///
  /// In zh, this message translates to:
  /// **'把月经量说清楚'**
  String get encyclopediaHeroTitle;

  /// No description provided for @encyclopediaHeroBody.
  ///
  /// In zh, this message translates to:
  /// **'经量不是主观感受，而是可理解、可估算的生理指标。'**
  String get encyclopediaHeroBody;

  /// No description provided for @copiedLink.
  ///
  /// In zh, this message translates to:
  /// **'已复制链接'**
  String get copiedLink;

  /// No description provided for @collapse.
  ///
  /// In zh, this message translates to:
  /// **'收起'**
  String get collapse;

  /// No description provided for @expand.
  ///
  /// In zh, this message translates to:
  /// **'展开'**
  String get expand;

  /// No description provided for @keyPoints.
  ///
  /// In zh, this message translates to:
  /// **'要点'**
  String get keyPoints;

  /// No description provided for @redFlags.
  ///
  /// In zh, this message translates to:
  /// **'红旗信号'**
  String get redFlags;

  /// No description provided for @kbVitalTag.
  ///
  /// In zh, this message translates to:
  /// **'精细管理'**
  String get kbVitalTag;

  /// No description provided for @kbVitalTitle.
  ///
  /// In zh, this message translates to:
  /// **'月经是一项生命体征'**
  String get kbVitalTitle;

  /// No description provided for @kbVitalLead.
  ///
  /// In zh, this message translates to:
  /// **'周期、经量、颜色、痛感和出血模式，都是身体信号。'**
  String get kbVitalLead;

  /// No description provided for @kbVitalBody1.
  ///
  /// In zh, this message translates to:
  /// **'把月经视为每月健康快照，可更早识别经量过多、贫血风险或长期疼痛。'**
  String get kbVitalBody1;

  /// No description provided for @kbVitalBody2.
  ///
  /// In zh, this message translates to:
  /// **'持续记录能把模糊感受变成可比较、可与医生沟通的数据。'**
  String get kbVitalBody2;

  /// No description provided for @kbVitalBullet1.
  ///
  /// In zh, this message translates to:
  /// **'记录是为了掌握变化，不是制造焦虑'**
  String get kbVitalBullet1;

  /// No description provided for @kbVitalBullet2.
  ///
  /// In zh, this message translates to:
  /// **'异常通常体现为趋势，而非单日波动'**
  String get kbVitalBullet2;

  /// No description provided for @kbVitalBullet3.
  ///
  /// In zh, this message translates to:
  /// **'清楚描述变化，更利于判断'**
  String get kbVitalBullet3;

  /// No description provided for @kbNormalTag.
  ///
  /// In zh, this message translates to:
  /// **'常识'**
  String get kbNormalTag;

  /// No description provided for @kbNormalTitle.
  ///
  /// In zh, this message translates to:
  /// **'了解正常范围，更容易识别异常'**
  String get kbNormalTitle;

  /// No description provided for @kbNormalLead.
  ///
  /// In zh, this message translates to:
  /// **'判断月经是否正常，不能只看来没来。'**
  String get kbNormalLead;

  /// No description provided for @kbNormalBody.
  ///
  /// In zh, this message translates to:
  /// **'周期、经期、总量、血块、颜色和疼痛应一起观察，突然变化更值得关注。'**
  String get kbNormalBody;

  /// No description provided for @kbNormalBullet1.
  ///
  /// In zh, this message translates to:
  /// **'周期 21-35 天较常见，重点是自身规律'**
  String get kbNormalBullet1;

  /// No description provided for @kbNormalBullet2.
  ///
  /// In zh, this message translates to:
  /// **'经期 3-8 天较常见，超过 7 天且量多需关注'**
  String get kbNormalBullet2;

  /// No description provided for @kbNormalBullet3.
  ///
  /// In zh, this message translates to:
  /// **'总量 20-80mL/周期较常见，明显超出可能提示风险'**
  String get kbNormalBullet3;

  /// No description provided for @kbNormalBullet4.
  ///
  /// In zh, this message translates to:
  /// **'频繁大血块、头晕乏力或夜间漏血值得记录'**
  String get kbNormalBullet4;

  /// No description provided for @kbRiskTag.
  ///
  /// In zh, this message translates to:
  /// **'风险'**
  String get kbRiskTag;

  /// No description provided for @kbRiskTitle.
  ///
  /// In zh, this message translates to:
  /// **'经量过多容易被忽视'**
  String get kbRiskTitle;

  /// No description provided for @kbRiskLead.
  ///
  /// In zh, this message translates to:
  /// **'量大不代表体质好，也不应硬扛。'**
  String get kbRiskLead;

  /// No description provided for @kbRiskBody.
  ///
  /// In zh, this message translates to:
  /// **'若需频繁更换用品、明显影响睡眠或工作，或伴随头晕乏力，应及时关注。'**
  String get kbRiskBody;

  /// No description provided for @kbRiskFlag1.
  ///
  /// In zh, this message translates to:
  /// **'连续数小时，每小时浸透 1 片卫生巾或棉条'**
  String get kbRiskFlag1;

  /// No description provided for @kbRiskFlag2.
  ///
  /// In zh, this message translates to:
  /// **'夜间需起床更换，或叠加使用多种用品'**
  String get kbRiskFlag2;

  /// No description provided for @kbRiskFlag3.
  ///
  /// In zh, this message translates to:
  /// **'经期超过 7 天且明显影响生活'**
  String get kbRiskFlag3;

  /// No description provided for @kbRiskFlag4.
  ///
  /// In zh, this message translates to:
  /// **'伴随乏力、头晕、心慌或气短'**
  String get kbRiskFlag4;

  /// No description provided for @kbTrackTag.
  ///
  /// In zh, this message translates to:
  /// **'自检'**
  String get kbTrackTag;

  /// No description provided for @kbTrackTitle.
  ///
  /// In zh, this message translates to:
  /// **'建议稳定记录 6 个维度'**
  String get kbTrackTitle;

  /// No description provided for @kbTrackLead.
  ///
  /// In zh, this message translates to:
  /// **'少而精，形成趋势就有价值。'**
  String get kbTrackLead;

  /// No description provided for @kbTrackBody.
  ///
  /// In zh, this message translates to:
  /// **'稳定记录以下维度，足以支持趋势判断和风险提示。'**
  String get kbTrackBody;

  /// No description provided for @kbTrackBullet1.
  ///
  /// In zh, this message translates to:
  /// **'开始、结束日期与持续天数'**
  String get kbTrackBullet1;

  /// No description provided for @kbTrackBullet2.
  ///
  /// In zh, this message translates to:
  /// **'每天经量或用品更换频率'**
  String get kbTrackBullet2;

  /// No description provided for @kbTrackBullet3.
  ///
  /// In zh, this message translates to:
  /// **'颜色与血块'**
  String get kbTrackBullet3;

  /// No description provided for @kbTrackBullet4.
  ///
  /// In zh, this message translates to:
  /// **'疼痛强度与是否用药'**
  String get kbTrackBullet4;

  /// No description provided for @kbTrackBullet5.
  ///
  /// In zh, this message translates to:
  /// **'是否存在非经期出血'**
  String get kbTrackBullet5;

  /// No description provided for @kbTrackBullet6.
  ///
  /// In zh, this message translates to:
  /// **'精力与睡眠变化'**
  String get kbTrackBullet6;

  /// No description provided for @homeSubtitleActive.
  ///
  /// In zh, this message translates to:
  /// **'按天记录，草稿自动保存。'**
  String get homeSubtitleActive;

  /// No description provided for @firstDayGuide.
  ///
  /// In zh, this message translates to:
  /// **'已定位到最近一次开始日，建议先补这一天。'**
  String get firstDayGuide;

  /// No description provided for @earliestDateReached.
  ///
  /// In zh, this message translates to:
  /// **'已到最早日期'**
  String get earliestDateReached;

  /// No description provided for @todayReached.
  ///
  /// In zh, this message translates to:
  /// **'已是今天'**
  String get todayReached;

  /// No description provided for @deletedEvent.
  ///
  /// In zh, this message translates to:
  /// **'已删除{target}'**
  String deletedEvent(Object target);

  /// No description provided for @undo.
  ///
  /// In zh, this message translates to:
  /// **'撤销'**
  String get undo;

  /// No description provided for @editEvent.
  ///
  /// In zh, this message translates to:
  /// **'编辑事件'**
  String get editEvent;

  /// No description provided for @padType.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾类型'**
  String get padType;

  /// No description provided for @tamponModel.
  ///
  /// In zh, this message translates to:
  /// **'棉条型号'**
  String get tamponModel;

  /// No description provided for @clotType.
  ///
  /// In zh, this message translates to:
  /// **'血块类型'**
  String get clotType;

  /// No description provided for @smallClot.
  ///
  /// In zh, this message translates to:
  /// **'小血块'**
  String get smallClot;

  /// No description provided for @largeClot.
  ///
  /// In zh, this message translates to:
  /// **'大血块'**
  String get largeClot;

  /// No description provided for @delete.
  ///
  /// In zh, this message translates to:
  /// **'删除'**
  String get delete;

  /// No description provided for @saveChanges.
  ///
  /// In zh, this message translates to:
  /// **'保存修改'**
  String get saveChanges;

  /// No description provided for @recordSaved.
  ///
  /// In zh, this message translates to:
  /// **'已保存记录'**
  String get recordSaved;

  /// No description provided for @recordSaveFailedDraftKept.
  ///
  /// In zh, this message translates to:
  /// **'提交失败，修改已保留在本地草稿'**
  String get recordSaveFailedDraftKept;

  /// No description provided for @recentDays.
  ///
  /// In zh, this message translates to:
  /// **'最近 14 天'**
  String get recentDays;

  /// No description provided for @dateStripHint.
  ///
  /// In zh, this message translates to:
  /// **'点日期切换；圆点看颜色，数字看总量。'**
  String get dateStripHint;

  /// No description provided for @previousDay.
  ///
  /// In zh, this message translates to:
  /// **'前一天'**
  String get previousDay;

  /// No description provided for @nextDay.
  ///
  /// In zh, this message translates to:
  /// **'后一天'**
  String get nextDay;

  /// No description provided for @today.
  ///
  /// In zh, this message translates to:
  /// **'今天'**
  String get today;

  /// No description provided for @switching.
  ///
  /// In zh, this message translates to:
  /// **'切换中'**
  String get switching;

  /// No description provided for @todayLimit.
  ///
  /// In zh, this message translates to:
  /// **'已到今天'**
  String get todayLimit;

  /// No description provided for @markColorAndClots.
  ///
  /// In zh, this message translates to:
  /// **'标记颜色与血块'**
  String get markColorAndClots;

  /// No description provided for @colorAndSymptoms.
  ///
  /// In zh, this message translates to:
  /// **'颜色与症状'**
  String get colorAndSymptoms;

  /// No description provided for @addSmallClot.
  ///
  /// In zh, this message translates to:
  /// **'+ 小血块'**
  String get addSmallClot;

  /// No description provided for @addLargeClot.
  ///
  /// In zh, this message translates to:
  /// **'+ 大血块'**
  String get addLargeClot;

  /// No description provided for @recordedItems.
  ///
  /// In zh, this message translates to:
  /// **'已记录项目'**
  String get recordedItems;

  /// No description provided for @todayRecords.
  ///
  /// In zh, this message translates to:
  /// **'今日记录'**
  String get todayRecords;

  /// No description provided for @noRecordsToday.
  ///
  /// In zh, this message translates to:
  /// **'今天还没记录。'**
  String get noRecordsToday;

  /// No description provided for @saveRecord.
  ///
  /// In zh, this message translates to:
  /// **'保存记录'**
  String get saveRecord;

  /// No description provided for @synced.
  ///
  /// In zh, this message translates to:
  /// **'已同步'**
  String get synced;

  /// No description provided for @symptomEvent.
  ///
  /// In zh, this message translates to:
  /// **'症状 · {name}'**
  String symptomEvent(Object name);

  /// No description provided for @padEvent.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾 · {type} · {volume}mL'**
  String padEvent(Object type, Object volume);

  /// No description provided for @tamponEvent.
  ///
  /// In zh, this message translates to:
  /// **'棉条 · {model} · {volume}mL'**
  String tamponEvent(Object model, Object volume);

  /// No description provided for @quotedEvent.
  ///
  /// In zh, this message translates to:
  /// **'「{name}」'**
  String quotedEvent(Object name);

  /// No description provided for @symptom.
  ///
  /// In zh, this message translates to:
  /// **'症状'**
  String get symptom;

  /// No description provided for @padRecord.
  ///
  /// In zh, this message translates to:
  /// **'卫生巾记录'**
  String get padRecord;

  /// No description provided for @tamponRecord.
  ///
  /// In zh, this message translates to:
  /// **'棉条记录'**
  String get tamponRecord;

  /// No description provided for @colorPink.
  ///
  /// In zh, this message translates to:
  /// **'粉'**
  String get colorPink;

  /// No description provided for @colorRed.
  ///
  /// In zh, this message translates to:
  /// **'红'**
  String get colorRed;

  /// No description provided for @colorRust.
  ///
  /// In zh, this message translates to:
  /// **'锈红'**
  String get colorRust;

  /// No description provided for @colorDark.
  ///
  /// In zh, this message translates to:
  /// **'深红'**
  String get colorDark;

  /// No description provided for @colorBrown.
  ///
  /// In zh, this message translates to:
  /// **'棕'**
  String get colorBrown;

  /// No description provided for @draftPending.
  ///
  /// In zh, this message translates to:
  /// **'草稿未提交'**
  String get draftPending;

  /// No description provided for @todayTotal.
  ///
  /// In zh, this message translates to:
  /// **'今日总量 {volume}mL'**
  String todayTotal(Object volume);

  /// No description provided for @realtimeVolumeHidden.
  ///
  /// In zh, this message translates to:
  /// **'实时血量已隐藏'**
  String get realtimeVolumeHidden;

  /// No description provided for @clotEstimate.
  ///
  /// In zh, this message translates to:
  /// **'血块估算'**
  String get clotEstimate;

  /// No description provided for @syncing.
  ///
  /// In zh, this message translates to:
  /// **'正在同步'**
  String get syncing;

  /// No description provided for @draftSavedAt.
  ///
  /// In zh, this message translates to:
  /// **'草稿已保存 {time}'**
  String draftSavedAt(Object time);

  /// No description provided for @syncedAt.
  ///
  /// In zh, this message translates to:
  /// **'已同步 {time}'**
  String syncedAt(Object time);

  /// No description provided for @cloudRecord.
  ///
  /// In zh, this message translates to:
  /// **'当前为云端记录'**
  String get cloudRecord;

  /// No description provided for @quickInput.
  ///
  /// In zh, this message translates to:
  /// **'快速录入'**
  String get quickInput;

  /// No description provided for @additionalInput.
  ///
  /// In zh, this message translates to:
  /// **'补充录入'**
  String get additionalInput;

  /// No description provided for @precisionInputHint.
  ///
  /// In zh, this message translates to:
  /// **'拖拽选择更精确的 mL 值。'**
  String get precisionInputHint;

  /// No description provided for @quickInputHint.
  ///
  /// In zh, this message translates to:
  /// **'点击预设值快速添加。'**
  String get quickInputHint;

  /// No description provided for @addVolume.
  ///
  /// In zh, this message translates to:
  /// **'添加 {volume}mL'**
  String addVolume(Object volume);

  /// No description provided for @tapToAdd.
  ///
  /// In zh, this message translates to:
  /// **'点按添加'**
  String get tapToAdd;

  /// No description provided for @reviewBeforeSubmit.
  ///
  /// In zh, this message translates to:
  /// **'提交前确认'**
  String get reviewBeforeSubmit;

  /// No description provided for @submitAndStart.
  ///
  /// In zh, this message translates to:
  /// **'提交并开始记录'**
  String get submitAndStart;

  /// No description provided for @completedProgress.
  ///
  /// In zh, this message translates to:
  /// **'已完成 {current}/{total}'**
  String completedProgress(Object current, Object total);

  /// No description provided for @previousQuestion.
  ///
  /// In zh, this message translates to:
  /// **'上一题'**
  String get previousQuestion;

  /// No description provided for @skip.
  ///
  /// In zh, this message translates to:
  /// **'跳过'**
  String get skip;

  /// No description provided for @nextQuestion.
  ///
  /// In zh, this message translates to:
  /// **'下一题'**
  String get nextQuestion;

  /// No description provided for @submittingShort.
  ///
  /// In zh, this message translates to:
  /// **'提交中'**
  String get submittingShort;

  /// No description provided for @searchAndSelect.
  ///
  /// In zh, this message translates to:
  /// **'搜索并选择'**
  String get searchAndSelect;

  /// No description provided for @uncertain.
  ///
  /// In zh, this message translates to:
  /// **'不确定'**
  String get uncertain;

  /// No description provided for @uncertainOrForgot.
  ///
  /// In zh, this message translates to:
  /// **'不确定/记不清'**
  String get uncertainOrForgot;

  /// No description provided for @preferNotToSay.
  ///
  /// In zh, this message translates to:
  /// **'不愿透露'**
  String get preferNotToSay;

  /// No description provided for @selectDate.
  ///
  /// In zh, this message translates to:
  /// **'选择日期'**
  String get selectDate;

  /// No description provided for @exactDate.
  ///
  /// In zh, this message translates to:
  /// **'具体日期'**
  String get exactDate;

  /// No description provided for @yearMonthOnly.
  ///
  /// In zh, this message translates to:
  /// **'只记得年月'**
  String get yearMonthOnly;

  /// No description provided for @year.
  ///
  /// In zh, this message translates to:
  /// **'年'**
  String get year;

  /// No description provided for @month.
  ///
  /// In zh, this message translates to:
  /// **'月'**
  String get month;

  /// No description provided for @analysisSubtitleActive.
  ///
  /// In zh, this message translates to:
  /// **'查看风险和周期变化。'**
  String get analysisSubtitleActive;

  /// No description provided for @loadFailedWithError.
  ///
  /// In zh, this message translates to:
  /// **'加载失败：{error}'**
  String loadFailedWithError(Object error);

  /// No description provided for @priorityRisks.
  ///
  /// In zh, this message translates to:
  /// **'重点风险'**
  String get priorityRisks;

  /// No description provided for @allCycles.
  ///
  /// In zh, this message translates to:
  /// **'所有周期'**
  String get allCycles;

  /// No description provided for @cycles.
  ///
  /// In zh, this message translates to:
  /// **'周期'**
  String get cycles;

  /// No description provided for @noCycles.
  ///
  /// In zh, this message translates to:
  /// **'还没有可分析的周期。'**
  String get noCycles;

  /// No description provided for @moreCycles.
  ///
  /// In zh, this message translates to:
  /// **'更多周期'**
  String get moreCycles;

  /// No description provided for @riskLinkCopied.
  ///
  /// In zh, this message translates to:
  /// **'说明链接已复制'**
  String get riskLinkCopied;

  /// No description provided for @sharing.
  ///
  /// In zh, this message translates to:
  /// **'分享中...'**
  String get sharing;

  /// No description provided for @share.
  ///
  /// In zh, this message translates to:
  /// **'分享'**
  String get share;

  /// No description provided for @scoreUnit.
  ///
  /// In zh, this message translates to:
  /// **'分'**
  String get scoreUnit;

  /// No description provided for @regularity.
  ///
  /// In zh, this message translates to:
  /// **'规律性'**
  String get regularity;

  /// No description provided for @recentCycle.
  ///
  /// In zh, this message translates to:
  /// **'最近周期'**
  String get recentCycle;

  /// No description provided for @cycleTimelineItem.
  ///
  /// In zh, this message translates to:
  /// **'{start} · {days}天 · {volume}mL{interval}'**
  String cycleTimelineItem(
    Object days,
    Object interval,
    Object start,
    Object volume,
  );

  /// No description provided for @cycleInterval.
  ///
  /// In zh, this message translates to:
  /// **' · 间隔{days}天'**
  String cycleInterval(Object days);

  /// No description provided for @sourceAcogVital.
  ///
  /// In zh, this message translates to:
  /// **'ACOG：月经是生命体征'**
  String get sourceAcogVital;

  /// No description provided for @sourceMayoCycle.
  ///
  /// In zh, this message translates to:
  /// **'Mayo Clinic：月经周期基础'**
  String get sourceMayoCycle;

  /// No description provided for @sourceCdcHeavy.
  ///
  /// In zh, this message translates to:
  /// **'CDC：重度月经出血'**
  String get sourceCdcHeavy;

  /// No description provided for @sourceNhsHeavy.
  ///
  /// In zh, this message translates to:
  /// **'NHS：经量过多'**
  String get sourceNhsHeavy;

  /// No description provided for @sourceMayoHeavy.
  ///
  /// In zh, this message translates to:
  /// **'Mayo Clinic：重度月经出血'**
  String get sourceMayoHeavy;

  /// No description provided for @sourceWhoEndometriosis.
  ///
  /// In zh, this message translates to:
  /// **'WHO：子宫内膜异位症'**
  String get sourceWhoEndometriosis;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
