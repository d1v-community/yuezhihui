// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => '月知会';

  @override
  String get brandName => '月知会';

  @override
  String get brandTagline => '邮箱验证码登录，继续引导，开始按日记录。';

  @override
  String get connecting => '正在连接服务...';

  @override
  String get continueAction => '继续';

  @override
  String get login => '登录';

  @override
  String get logout => '退出登录';

  @override
  String get email => '邮箱';

  @override
  String get emailPlaceholder => 'name@example.com';

  @override
  String get sendCode => '发送验证码';

  @override
  String get verificationCode => '验证码';

  @override
  String get verifyAndLogin => '验证并登录';

  @override
  String get resendCode => '重新发送';

  @override
  String get codeSentHint => '验证码已发送到该邮箱';

  @override
  String get marketingHint => '我们不会发送营销邮件';

  @override
  String get invalidEmail => '请输入正确邮箱';

  @override
  String get invalidCode => '请输入 6 位验证码';

  @override
  String get loadFailed => '加载失败，请稍后重试';

  @override
  String get homeTab => '每日';

  @override
  String get analysisTab => '分析';

  @override
  String get settingsTab => '设置';

  @override
  String get homeTitle => '每日记录';

  @override
  String get homeSubtitle => '参考现有 Taro 设计，保留轻量卡片和柔和底色。';

  @override
  String get openOnboarding => '继续问卷';

  @override
  String get viewAnalysis => '查看分析';

  @override
  String get todaySummary => '今日状态';

  @override
  String get signedInAs => '当前账号';

  @override
  String get analysisTitle => '分析';

  @override
  String get analysisSubtitle => '记录会自动汇总为周期，并生成趋势与风险提示。';

  @override
  String get startAnalysis => '开始分析';

  @override
  String get healthScore => '健康分';

  @override
  String get cycleCount => '周期数';

  @override
  String get trend => '趋势';

  @override
  String get settingsTitle => '设置';

  @override
  String get settingsSubtitle => '账号、语言与基础偏好。';

  @override
  String get language => '语言';

  @override
  String get languageSystem => '跟随系统';

  @override
  String get languageZh => '中文';

  @override
  String get languageEn => 'English';

  @override
  String get apiBaseUrl => '接口地址';

  @override
  String get copyTokenHint => 'Flutter 客户端直接使用 Bearer Token，不依赖 Cookie。';

  @override
  String get loggedOut => '已退出登录';

  @override
  String get onboardingTitle => '问卷引导';

  @override
  String get onboardingSubtitle =>
      '当前仓库已具备完整问卷 API，Flutter 侧先保留占位页，下一步可以按 Taro 页面继续补齐。';

  @override
  String get goToHome => '进入主页';

  @override
  String get unknown => '未填写';

  @override
  String get authenticated => '已登录';

  @override
  String get notAuthenticated => '未登录';

  @override
  String get useTampon => '启用棉条模块';

  @override
  String get refresh => '刷新';

  @override
  String get loading => '加载中...';

  @override
  String get retry => '重试';
}
