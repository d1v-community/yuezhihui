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
  /// **'FlowCycle'**
  String get brandName;

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
  /// **'账号、语言与基础偏好。'**
  String get settingsSubtitle;

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
