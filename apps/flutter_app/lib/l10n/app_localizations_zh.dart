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
  String get brandWordmark => 'FLOWSENSE';

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
  String get verifyEmail => '验证邮箱';

  @override
  String get enterEmail => '输入邮箱';

  @override
  String get editEmail => '修改';

  @override
  String get clearEmail => '清空邮箱';

  @override
  String get enterCode => '输入验证码';

  @override
  String get codePlaceholder => '输入 6 位数字';

  @override
  String get pasteCode => '粘贴验证码';

  @override
  String get resendAvailable => '可重新发送';

  @override
  String resendCountdown(int seconds) {
    return '${seconds}s 后可重发';
  }

  @override
  String get devCode => '开发环境验证码';

  @override
  String get codeCopied => '验证码已复制';

  @override
  String get copyCode => '复制验证码';

  @override
  String get fillAndLogin => '填入并登录';

  @override
  String get browseEncyclopedia => '浏览百科';

  @override
  String get codeResent => '验证码已重新发送';

  @override
  String get clipboardCodeMissing => '剪贴板里没有 6 位验证码';

  @override
  String get emailCodeLogin => '邮箱验证码登录';

  @override
  String get codeSentDescription => '6 位数字验证码已发送到邮箱。';

  @override
  String get verificationStep => '验证';

  @override
  String get sendCodeFailed => '验证码发送失败，请稍后重试';

  @override
  String get invalidOrExpiredCode => '验证码无效或已过期';

  @override
  String get loginFailed => '登录失败，请稍后重试';

  @override
  String get unexpectedError => '发生未知错误，请稍后重试';

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
  String get encyclopediaTab => '百科';

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
  String get settingsSubtitle => '账号、隐私和记录偏好。';

  @override
  String get signedInAccount => '已登录账户';

  @override
  String get accountSection => '账号';

  @override
  String get privacyLanguageSection => '隐私与语言';

  @override
  String get recordDisplaySection => '记录展示';

  @override
  String get supportFeedbackSection => '支持与反馈';

  @override
  String get nickname => '昵称';

  @override
  String get nicknameSaved => '昵称已保存';

  @override
  String get saving => '保存中...';

  @override
  String get saveNickname => '保存昵称';

  @override
  String get tamponHabit => '我习惯用卫生棉条';

  @override
  String get tamponHabitHint => '同步账号，并控制首页是否显示棉条';

  @override
  String get showTamponRecords => '显示棉条记录';

  @override
  String get hideTamponRecords => '隐藏棉条记录';

  @override
  String researchConsent(Object status) {
    return '研究同意：$status';
  }

  @override
  String researchConsentStatus(Object status) {
    return '研究同意状态：$status';
  }

  @override
  String get consentAgreed => '已同意';

  @override
  String get consentDeclined => '未同意';

  @override
  String get consentNotSet => '未填写';

  @override
  String get consentUnavailable => '未读取';

  @override
  String get editResearchConsent => '修改研究同意';

  @override
  String get savingPreferences => '正在保存偏好...';

  @override
  String get preferencesSaveFailed => '保存失败，已恢复上一次设置';

  @override
  String get displaySettingsSaved => '显示设置已保存';

  @override
  String get inputModeSaved => '录入方式已保存';

  @override
  String get showPadModule => '显示卫生巾模块';

  @override
  String get showPadModuleHint => '只影响首页显示，不影响已记录数据';

  @override
  String get showRealtimeBleeding => '显示实时血量';

  @override
  String get showRealtimeBleedingHint => '关闭后只隐藏汇总，不影响记录和分析';

  @override
  String get inputMode => '输入模式';

  @override
  String get inputModeHint => '打开精确模式后，将采用拖拽滑杆的方式精确控制血量；关闭则使用点击快捷添加。';

  @override
  String get padPrecisionMode => '卫生巾精确模式';

  @override
  String get tamponPrecisionMode => '棉条精确模式';

  @override
  String get dragSliderInput => '拖动滑杆录入';

  @override
  String get quickButtonInput => '点按钮快速添加';

  @override
  String get padPrecisionPreview => '卫生巾精确模式预览';

  @override
  String get tamponPrecisionPreview => '卫生棉条精确模式预览';

  @override
  String get previewSpecifications => '点击查看规格与血量预览';

  @override
  String get previewTamponHeight => '点击查看型号与浸润高度预览';

  @override
  String get previewEnabledEffect => '点击预览开启后的效果';

  @override
  String get padPreviewTitle => '卫生巾 · 精确模式预览';

  @override
  String get tamponPreviewTitle => '卫生棉条 · 精确模式预览';

  @override
  String get precisionEnabledCaption => '当前已开启精确录入，首页会显示同样的规格与滑杆逻辑。';

  @override
  String get tamponPrecisionEnabledCaption => '当前已开启精确录入，浸润高度会随着血量变化。';

  @override
  String get quickModeCaption => '当前是快捷模式；开启后首页会切换成拖拽录入。';

  @override
  String get padUnit => 'mL / 片';

  @override
  String get tamponUnit => 'mL / 条';

  @override
  String get padLiner => '护垫';

  @override
  String get padDay => '日用';

  @override
  String get padNight => '夜用';

  @override
  String get padPants => '安睡裤';

  @override
  String get tamponMini => '迷你';

  @override
  String get tamponRegular => '常规';

  @override
  String get tamponLarge => '大号';

  @override
  String get tamponSuper => '超大';

  @override
  String get pad => '卫生巾';

  @override
  String get tampon => '卫生棉条';

  @override
  String bleedingVolume(Object volume) {
    return '血量 $volume';
  }

  @override
  String get volumeLow => '少';

  @override
  String get volumeMedium => '中';

  @override
  String get volumeHigh => '多';

  @override
  String get preview => '预览';

  @override
  String get done => '完成';

  @override
  String get submitFeedback => '提交反馈';

  @override
  String get deleteAccount => '删除账号';

  @override
  String get deleteAccountDescription =>
      '删除后会立即退出登录。后续若使用同一邮箱再次注册，系统会创建一个全新的账号，不会恢复当前数据。';

  @override
  String get confirmCurrentEmail => '请输入当前邮箱确认删除：';

  @override
  String get confirmEmail => '确认邮箱';

  @override
  String get deletingAccountState => '正在删除账号并清理当前登录状态...';

  @override
  String get cancel => '取消';

  @override
  String get deleting => '删除中...';

  @override
  String get confirmDelete => '确认删除';

  @override
  String get confirmDeleteEmailError => '请输入当前登录邮箱以确认删除';

  @override
  String get accountDeleted => '账号已删除。重新注册将创建新账号。';

  @override
  String get guestBanner => '当前是游客模式：百科可直接看，记录与分析需要登录。';

  @override
  String get goToLogin => '去登录';

  @override
  String get continueAfterLogin => '登录后继续';

  @override
  String get loginRequired => '当前功能需要登录后使用。';

  @override
  String get loginBenefitDescription => '登录后可保存每日记录、查看分析结果，并在多端同步你的数据。';

  @override
  String get loginBenefitRecords => '保存记录，不怕丢失';

  @override
  String get loginBenefitAnalysis => '自动生成周期分析';

  @override
  String get loginBenefitSync => '支持后续多端同步';

  @override
  String get browseFirst => '先看看';

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

  @override
  String get guestGateTitle => '该页面需要登录';

  @override
  String get guestGateDescription => '百科可直接浏览，记录、分析和设置需要登录。';

  @override
  String get backToEncyclopedia => '返回百科';

  @override
  String get feedbackTitle => '反馈';

  @override
  String get feedbackType => '问题类型';

  @override
  String get feedbackBug => '功能异常';

  @override
  String get feedbackExperience => '体验问题';

  @override
  String get feedbackFeature => '功能建议';

  @override
  String get feedbackContent => '内容反馈';

  @override
  String get feedbackOther => '其他';

  @override
  String get feedbackSubmitted => '提交成功';

  @override
  String get feedbackDraftRestored => '已恢复上次内容';

  @override
  String get feedbackDraftHint => '输入时自动保存草稿';

  @override
  String feedbackDraftSaved(Object time) {
    return '草稿已保存 $time';
  }

  @override
  String get feedbackDescription => '问题描述';

  @override
  String get feedbackDescriptionHint => '请说明操作、预期和实际结果';

  @override
  String get feedbackSpecificHint => '越具体，越容易定位';

  @override
  String get feedbackMinimumHint => '至少写 5 个字';

  @override
  String get feedbackContact => '联系方式（可选）';

  @override
  String get feedbackContactHint => '邮箱 / 微信 / 手机';

  @override
  String get submitting => '提交中...';

  @override
  String get cycleDetail => '周期详情';

  @override
  String get cycleShareCopied => '已复制周期分享路径';

  @override
  String get cycleSummaryCopied => '已复制周期摘要';

  @override
  String get copyCycleSummary => '复制周期摘要';

  @override
  String get explanationLinkCopied => '已复制解释链接';

  @override
  String get dailyDetails => '日明细';

  @override
  String get noBleedingDays => '该周期暂无出血日数据。';

  @override
  String get productSettlement => '用品结算';

  @override
  String get cycleLoadFailed => '周期详情加载失败';

  @override
  String daysAndVolume(Object days, Object volume) {
    return '$days天 · ${volume}mL';
  }

  @override
  String dayDetails(Object clot, Object color, Object symptoms) {
    return '颜色 $color · 血块 $clot · 症状 $symptoms';
  }

  @override
  String get notRecorded => '未记录';

  @override
  String get level => '水平';

  @override
  String get distribution => '分布';

  @override
  String get color => '颜色';

  @override
  String get clot => '血块';

  @override
  String get distributionAbnormal => '分布异常';

  @override
  String get colorAbnormal => '颜色异常';

  @override
  String get clotAbnormal => '血块异常';

  @override
  String get trendStable => '整体趋势平稳';

  @override
  String summaryHighlights(Object highlights) {
    return '重点：$highlights';
  }

  @override
  String get encyclopediaTitle => '百科';

  @override
  String get encyclopediaSubtitle => '读懂经量、风险和变化。';

  @override
  String get encyclopediaNote => '健康笔记';

  @override
  String get encyclopediaHeroTitle => '把月经量说清楚';

  @override
  String get encyclopediaHeroBody => '经量不是主观感受，而是可理解、可估算的生理指标。';

  @override
  String get copiedLink => '已复制链接';

  @override
  String get collapse => '收起';

  @override
  String get expand => '展开';

  @override
  String get keyPoints => '要点';

  @override
  String get redFlags => '红旗信号';

  @override
  String get kbVitalTag => '精细管理';

  @override
  String get kbVitalTitle => '月经是一项生命体征';

  @override
  String get kbVitalLead => '周期、经量、颜色、痛感和出血模式，都是身体信号。';

  @override
  String get kbVitalBody1 => '把月经视为每月健康快照，可更早识别经量过多、贫血风险或长期疼痛。';

  @override
  String get kbVitalBody2 => '持续记录能把模糊感受变成可比较、可与医生沟通的数据。';

  @override
  String get kbVitalBullet1 => '记录是为了掌握变化，不是制造焦虑';

  @override
  String get kbVitalBullet2 => '异常通常体现为趋势，而非单日波动';

  @override
  String get kbVitalBullet3 => '清楚描述变化，更利于判断';

  @override
  String get kbNormalTag => '常识';

  @override
  String get kbNormalTitle => '了解正常范围，更容易识别异常';

  @override
  String get kbNormalLead => '判断月经是否正常，不能只看来没来。';

  @override
  String get kbNormalBody => '周期、经期、总量、血块、颜色和疼痛应一起观察，突然变化更值得关注。';

  @override
  String get kbNormalBullet1 => '周期 21-35 天较常见，重点是自身规律';

  @override
  String get kbNormalBullet2 => '经期 3-8 天较常见，超过 7 天且量多需关注';

  @override
  String get kbNormalBullet3 => '总量 20-80mL/周期较常见，明显超出可能提示风险';

  @override
  String get kbNormalBullet4 => '频繁大血块、头晕乏力或夜间漏血值得记录';

  @override
  String get kbRiskTag => '风险';

  @override
  String get kbRiskTitle => '经量过多容易被忽视';

  @override
  String get kbRiskLead => '量大不代表体质好，也不应硬扛。';

  @override
  String get kbRiskBody => '若需频繁更换用品、明显影响睡眠或工作，或伴随头晕乏力，应及时关注。';

  @override
  String get kbRiskFlag1 => '连续数小时，每小时浸透 1 片卫生巾或棉条';

  @override
  String get kbRiskFlag2 => '夜间需起床更换，或叠加使用多种用品';

  @override
  String get kbRiskFlag3 => '经期超过 7 天且明显影响生活';

  @override
  String get kbRiskFlag4 => '伴随乏力、头晕、心慌或气短';

  @override
  String get kbTrackTag => '自检';

  @override
  String get kbTrackTitle => '建议稳定记录 6 个维度';

  @override
  String get kbTrackLead => '少而精，形成趋势就有价值。';

  @override
  String get kbTrackBody => '稳定记录以下维度，足以支持趋势判断和风险提示。';

  @override
  String get kbTrackBullet1 => '开始、结束日期与持续天数';

  @override
  String get kbTrackBullet2 => '每天经量或用品更换频率';

  @override
  String get kbTrackBullet3 => '颜色与血块';

  @override
  String get kbTrackBullet4 => '疼痛强度与是否用药';

  @override
  String get kbTrackBullet5 => '是否存在非经期出血';

  @override
  String get kbTrackBullet6 => '精力与睡眠变化';

  @override
  String get homeSubtitleActive => '按天记录，草稿自动保存。';

  @override
  String get firstDayGuide => '已定位到最近一次开始日，建议先补这一天。';

  @override
  String get earliestDateReached => '已到最早日期';

  @override
  String get todayReached => '已是今天';

  @override
  String deletedEvent(Object target) {
    return '已删除$target';
  }

  @override
  String get undo => '撤销';

  @override
  String get editEvent => '编辑事件';

  @override
  String get padType => '卫生巾类型';

  @override
  String get tamponModel => '棉条型号';

  @override
  String get clotType => '血块类型';

  @override
  String get smallClot => '小血块';

  @override
  String get largeClot => '大血块';

  @override
  String get delete => '删除';

  @override
  String get saveChanges => '保存修改';

  @override
  String get recordSaved => '已保存记录';

  @override
  String get recordSaveFailedDraftKept => '提交失败，修改已保留在本地草稿';

  @override
  String get recentDays => '最近 14 天';

  @override
  String get dateStripHint => '点日期切换；圆点看颜色，数字看总量。';

  @override
  String get previousDay => '前一天';

  @override
  String get nextDay => '后一天';

  @override
  String get today => '今天';

  @override
  String get switching => '切换中';

  @override
  String get todayLimit => '已到今天';

  @override
  String get markColorAndClots => '标记颜色与血块';

  @override
  String get colorAndSymptoms => '颜色与症状';

  @override
  String get addSmallClot => '+ 小血块';

  @override
  String get addLargeClot => '+ 大血块';

  @override
  String get recordedItems => '已记录项目';

  @override
  String get todayRecords => '今日记录';

  @override
  String get noRecordsToday => '今天还没记录。';

  @override
  String get saveRecord => '保存记录';

  @override
  String get synced => '已同步';

  @override
  String symptomEvent(Object name) {
    return '症状 · $name';
  }

  @override
  String padEvent(Object type, Object volume) {
    return '卫生巾 · $type · ${volume}mL';
  }

  @override
  String tamponEvent(Object model, Object volume) {
    return '棉条 · $model · ${volume}mL';
  }

  @override
  String quotedEvent(Object name) {
    return '「$name」';
  }

  @override
  String get symptom => '症状';

  @override
  String get padRecord => '卫生巾记录';

  @override
  String get tamponRecord => '棉条记录';

  @override
  String get colorPink => '粉';

  @override
  String get colorRed => '红';

  @override
  String get colorRust => '锈红';

  @override
  String get colorDark => '深红';

  @override
  String get colorBrown => '棕';

  @override
  String get draftPending => '草稿未提交';

  @override
  String todayTotal(Object volume) {
    return '今日总量 ${volume}mL';
  }

  @override
  String get realtimeVolumeHidden => '实时血量已隐藏';

  @override
  String get clotEstimate => '血块估算';

  @override
  String get syncing => '正在同步';

  @override
  String draftSavedAt(Object time) {
    return '草稿已保存 $time';
  }

  @override
  String syncedAt(Object time) {
    return '已同步 $time';
  }

  @override
  String get cloudRecord => '当前为云端记录';

  @override
  String get quickInput => '快速录入';

  @override
  String get additionalInput => '补充录入';

  @override
  String get precisionInputHint => '拖拽选择更精确的 mL 值。';

  @override
  String get quickInputHint => '点击预设值快速添加。';

  @override
  String addVolume(Object volume) {
    return '添加 ${volume}mL';
  }

  @override
  String get tapToAdd => '点按添加';

  @override
  String get reviewBeforeSubmit => '提交前确认';

  @override
  String get submitAndStart => '提交并开始记录';

  @override
  String completedProgress(Object current, Object total) {
    return '已完成 $current/$total';
  }

  @override
  String get previousQuestion => '上一题';

  @override
  String get skip => '跳过';

  @override
  String get nextQuestion => '下一题';

  @override
  String get submittingShort => '提交中';

  @override
  String get searchAndSelect => '搜索并选择';

  @override
  String get uncertain => '不确定';

  @override
  String get uncertainOrForgot => '不确定/记不清';

  @override
  String get preferNotToSay => '不愿透露';

  @override
  String get selectDate => '选择日期';

  @override
  String get exactDate => '具体日期';

  @override
  String get yearMonthOnly => '只记得年月';

  @override
  String get year => '年';

  @override
  String get month => '月';

  @override
  String get analysisSubtitleActive => '查看风险和周期变化。';

  @override
  String loadFailedWithError(Object error) {
    return '加载失败：$error';
  }

  @override
  String get priorityRisks => '重点风险';

  @override
  String get allCycles => '所有周期';

  @override
  String get cycles => '周期';

  @override
  String get noCycles => '还没有可分析的周期。';

  @override
  String get moreCycles => '更多周期';

  @override
  String get riskLinkCopied => '说明链接已复制';

  @override
  String get sharing => '分享中...';

  @override
  String get share => '分享';

  @override
  String get scoreUnit => '分';

  @override
  String get regularity => '规律性';

  @override
  String get recentCycle => '最近周期';

  @override
  String cycleTimelineItem(
    Object days,
    Object interval,
    Object start,
    Object volume,
  ) {
    return '$start · $days天 · ${volume}mL$interval';
  }

  @override
  String cycleInterval(Object days) {
    return ' · 间隔$days天';
  }

  @override
  String get sourceAcogVital => 'ACOG：月经是生命体征';

  @override
  String get sourceMayoCycle => 'Mayo Clinic：月经周期基础';

  @override
  String get sourceCdcHeavy => 'CDC：重度月经出血';

  @override
  String get sourceNhsHeavy => 'NHS：经量过多';

  @override
  String get sourceMayoHeavy => 'Mayo Clinic：重度月经出血';

  @override
  String get sourceWhoEndometriosis => 'WHO：子宫内膜异位症';
}
