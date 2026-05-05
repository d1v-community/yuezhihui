import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/i18n/locale_controller.dart';
import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  final _displayNameController = TextEditingController();
  bool _updatingProfile = false;
  bool _loadingPrefs = true;
  bool _savingPrefs = false;
  bool _showPad = true;
  bool _showBleeding = true;
  String _padInputMode = 'click';
  String _tamponInputMode = 'click';
  String _consentText = '未读取';
  String? _prefsStatusText;
  bool _prefsSaveFailed = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(sessionControllerProvider).user;
    _displayNameController.text = user?.displayName ?? '';
    Future.microtask(_loadPrefs);
  }

  Future<void> _loadPrefs() async {
    try {
      final storage = await ref.read(appStorageProvider.future);
      final visibility =
          storage.getJsonMap(AppKeys.visibilitySettings) ?? const {};
      final inputMode =
          storage.getJsonMap(AppKeys.inputModeSettings) ?? const {};
      final onboardingState = await ref.read(onboardingApiProvider).state();
      final consentAnswer =
          onboardingState.answers['A0_consent_research']
              as Map<String, dynamic>?;
      final consentValue = consentAnswer?['value']?.toString();
      if (!mounted) return;
      setState(() {
        _showPad = visibility['sanitaryPad'] is bool
            ? visibility['sanitaryPad'] as bool
            : true;
        _showBleeding = visibility['bleeding'] is bool
            ? visibility['bleeding'] as bool
            : true;
        _padInputMode = inputMode['sanitaryPad'] == 'drag' ? 'drag' : 'click';
        _tamponInputMode = inputMode['tampon'] == 'drag' ? 'drag' : 'click';
        _consentText = consentValue == 'yes'
            ? '已同意'
            : consentValue == 'no'
            ? '未同意'
            : '未填写';
        _loadingPrefs = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _consentText = '未读取';
        _loadingPrefs = false;
      });
    }
  }

  Future<void> _saveVisibility() async {
    final storage = await ref.read(appStorageProvider.future);
    await storage.setJsonMap(AppKeys.visibilitySettings, {
      'sanitaryPad': _showPad,
      'bleeding': _showBleeding,
    });
  }

  Future<void> _saveInputMode() async {
    final storage = await ref.read(appStorageProvider.future);
    await storage.setJsonMap(AppKeys.inputModeSettings, {
      'sanitaryPad': _padInputMode,
      'tampon': _tamponInputMode,
    });
  }

  Future<void> _runPrefsSave({
    required Future<void> Function() persist,
    required VoidCallback rollback,
    required String successText,
  }) async {
    setState(() {
      _savingPrefs = true;
      _prefsSaveFailed = false;
      _prefsStatusText = '正在保存偏好...';
    });
    try {
      await persist();
      if (!mounted) return;
      setState(() {
        _savingPrefs = false;
        _prefsStatusText = successText;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        rollback();
        _savingPrefs = false;
        _prefsSaveFailed = true;
        _prefsStatusText = '保存失败，已恢复上一次设置';
      });
    }
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeState = ref.watch(localeControllerProvider);
    final userEmail = ref.watch(
      sessionControllerProvider.select((state) => state.user?.email),
    );
    final userDisplayName = ref.watch(
      sessionControllerProvider.select((state) => state.user?.displayName),
    );
    final useTampon = ref.watch(
      sessionControllerProvider.select(
        (state) => state.user?.useTampon ?? true,
      ),
    );

    return FlowPage(
      title: l10n.settingsTitle,
      subtitle: '账号、隐私、记录展示与输入方式。',
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFBF4EF), Color(0xFFF3E6DE)],
            ),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: Color(0xFF8C3B4D),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_outline, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userDisplayName?.isNotEmpty == true
                          ? userDisplayName!
                          : '已登录账户',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(userEmail ?? l10n.unknown),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(label: Text(useTampon ? '棉条模块已启用' : '棉条模块已关闭')),
                        Chip(label: Text('研究同意：$_consentText')),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PROFILE',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text('账号', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text(userEmail ?? l10n.unknown),
                const SizedBox(height: 16),
                TextField(
                  controller: _displayNameController,
                  decoration: const InputDecoration(labelText: '昵称'),
                ),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: _updatingProfile
                      ? null
                      : () async {
                          setState(() => _updatingProfile = true);
                          final messenger = ScaffoldMessenger.of(context);
                          try {
                            await ref
                                .read(userApiProvider)
                                .updateProfile(
                                  displayName: _displayNameController.text
                                      .trim(),
                                );
                            await ref
                                .read(sessionControllerProvider.notifier)
                                .refreshSession();
                            if (!mounted) return;
                            messenger.showSnackBar(
                              const SnackBar(content: Text('昵称已保存')),
                            );
                          } finally {
                            if (mounted) {
                              setState(() => _updatingProfile = false);
                            }
                          }
                        },
                  child: Text(_updatingProfile ? '保存中...' : '保存昵称'),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('我习惯用卫生棉条'),
                  subtitle: const Text('同步到账号，用于控制首页是否展示棉条模块'),
                  value: useTampon,
                  onChanged: (value) async {
                    await ref
                        .read(userApiProvider)
                        .updateProfile(useTampon: value);
                    await ref
                        .read(sessionControllerProvider.notifier)
                        .refreshSession();
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PRIVACY',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text('隐私与语言', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F1EC),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text('研究同意：$_consentText'),
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () async {
                    await ref
                        .read(onboardingApiProvider)
                        .position('A0_consent_research');
                    if (!context.mounted) return;
                    context.go('/onboarding?mode=edit');
                  },
                  child: const Text('修改研究同意'),
                ),
                const SizedBox(height: 16),
                Text(l10n.language),
                const SizedBox(height: 8),
                SegmentedButton<String?>(
                  segments: [
                    ButtonSegment(
                      value: null,
                      label: Text(l10n.languageSystem),
                    ),
                    ButtonSegment(value: 'zh', label: Text(l10n.languageZh)),
                    ButtonSegment(value: 'en', label: Text(l10n.languageEn)),
                  ],
                  selected: {localeState.locale?.languageCode},
                  onSelectionChanged: (selection) {
                    ref
                        .read(localeControllerProvider.notifier)
                        .setLocale(selection.firstOrNull);
                  },
                ),
                const SizedBox(height: 16),
                Text('${l10n.apiBaseUrl}: ${AppConfig.apiBaseUrl}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: _loadingPrefs
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PREFERENCES',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '记录展示',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      if (_prefsStatusText != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: _prefsSaveFailed
                                ? Theme.of(context).colorScheme.errorContainer
                                : const Color(0xFFF6EFEA),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _savingPrefs
                                    ? Icons.sync
                                    : _prefsSaveFailed
                                    ? Icons.error_outline
                                    : Icons.check_circle_outline,
                                size: 18,
                                color: _prefsSaveFailed
                                    ? Theme.of(
                                        context,
                                      ).colorScheme.onErrorContainer
                                    : Theme.of(context).colorScheme.primary,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _prefsStatusText!,
                                  style: TextStyle(
                                    color: _prefsSaveFailed
                                        ? Theme.of(
                                            context,
                                          ).colorScheme.onErrorContainer
                                        : null,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('显示卫生巾模块'),
                        subtitle: const Text('仅影响首页展示，不影响已记录数据'),
                        value: _showPad,
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _showPad;
                                setState(() => _showPad = value);
                                _runPrefsSave(
                                  persist: _saveVisibility,
                                  rollback: () => _showPad = previous,
                                  successText: '展示偏好已保存',
                                );
                              },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('显示实时血量'),
                        subtitle: const Text('关闭后仅隐藏汇总展示，不影响记录与分析'),
                        value: _showBleeding,
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _showBleeding;
                                setState(() => _showBleeding = value);
                                _runPrefsSave(
                                  persist: _saveVisibility,
                                  rollback: () => _showBleeding = previous,
                                  successText: '展示偏好已保存',
                                );
                              },
                      ),
                      const Divider(height: 28),
                      Text(
                        '输入模式',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('卫生巾精确模式'),
                        subtitle: Text(
                          _padInputMode == 'drag' ? '拖拽滑杆精确录入' : '快捷按钮快速添加',
                        ),
                        value: _padInputMode == 'drag',
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _padInputMode;
                                setState(
                                  () =>
                                      _padInputMode = value ? 'drag' : 'click',
                                );
                                _runPrefsSave(
                                  persist: _saveInputMode,
                                  rollback: () => _padInputMode = previous,
                                  successText: '输入方式已保存',
                                );
                              },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('棉条精确模式'),
                        subtitle: Text(
                          _tamponInputMode == 'drag' ? '拖拽滑杆精确录入' : '快捷按钮快速添加',
                        ),
                        value: _tamponInputMode == 'drag',
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _tamponInputMode;
                                setState(
                                  () => _tamponInputMode = value
                                      ? 'drag'
                                      : 'click',
                                );
                                _runPrefsSave(
                                  persist: _saveInputMode,
                                  rollback: () => _tamponInputMode = previous,
                                  successText: '输入方式已保存',
                                );
                              },
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SUPPORT',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text('支持与反馈', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => context.go('/feedback'),
                  child: const Text('提交反馈'),
                ),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: () async {
                    await ref.read(sessionControllerProvider.notifier).logout();
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(l10n.loggedOut)));
                  },
                  child: Text(l10n.logout),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
