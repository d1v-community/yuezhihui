import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';
import '../../../core/utils/json_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';
import '../../shared/presentation/language_switcher.dart';

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
  bool _deletingAccount = false;
  bool _showPad = true;
  bool _showBleeding = true;
  String _padInputMode = 'click';
  String _tamponInputMode = 'click';
  String? _consentValue;
  String? _prefsStatusText;
  bool _prefsSaveFailed = false;
  String _padPreviewType = 'day';
  String _tamponPreviewModel = 'regular';
  double _padPreviewVolume = 5;
  double _tamponPreviewVolume = 5;

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
      final consentAnswer = asStringMap(
        onboardingState.answers['A0_consent_research'],
      );
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
        _consentValue = consentValue;
        _loadingPrefs = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _consentValue = null;
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
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _savingPrefs = true;
      _prefsSaveFailed = false;
      _prefsStatusText = l10n.savingPreferences;
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
        _prefsStatusText = l10n.preferencesSaveFailed;
      });
    }
  }

  Future<void> _confirmDeleteAccount(String email) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        final emailController = TextEditingController();
        bool isSubmitting = false;
        String? errorText;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            final normalizedInput = emailController.text.trim();
            final canSubmit =
                !isSubmitting &&
                normalizedInput.isNotEmpty &&
                normalizedInput == email;

            return AlertDialog(
              title: Text(l10n.deleteAccount),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.deleteAccountDescription),
                  const SizedBox(height: 16),
                  Text(
                    l10n.confirmCurrentEmail,
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  const SizedBox(height: 8),
                  SelectableText(email),
                  const SizedBox(height: 12),
                  TextField(
                    controller: emailController,
                    enabled: !isSubmitting,
                    keyboardType: TextInputType.emailAddress,
                    autofocus: true,
                    onChanged: (_) {
                      setDialogState(() {
                        errorText = null;
                      });
                    },
                    decoration: InputDecoration(
                      labelText: l10n.confirmEmail,
                      hintText: email,
                      errorText: errorText,
                    ),
                  ),
                  if (isSubmitting) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Expanded(child: Text(l10n.deletingAccountState)),
                      ],
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting
                      ? null
                      : () => Navigator.of(context).pop(false),
                  child: Text(l10n.cancel),
                ),
                FilledButton(
                  onPressed: !canSubmit
                      ? null
                      : () {
                          if (normalizedInput != email) {
                            setDialogState(() {
                              errorText = l10n.confirmDeleteEmailError;
                            });
                            return;
                          }
                          setDialogState(() {
                            isSubmitting = true;
                            errorText = null;
                          });
                          Navigator.of(context).pop(true);
                        },
                  child: Text(
                    isSubmitting ? l10n.deleting : l10n.confirmDelete,
                  ),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirmed != true || !mounted) return;
    setState(() => _deletingAccount = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(userApiProvider).deleteAccount();
      await ref.read(sessionControllerProvider.notifier).logout();
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(l10n.accountDeleted)));
      context.go('/encyclopedia');
    } catch (error) {
      if (!mounted) return;
      final message = error.toString().replaceFirst('Exception: ', '');
      messenger.showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) {
        setState(() => _deletingAccount = false);
      }
    }
  }

  Future<void> _showPrecisionPreviewSheet({
    required String title,
    required String caption,
    required Map<String, String> options,
    required String selectedValue,
    required double volume,
    required String valueUnitLabel,
    required ValueChanged<String> onSelected,
    required ValueChanged<double> onVolumeChanged,
    required Widget Function(String selectedValue, double volume) stageBuilder,
  }) async {
    final l10n = AppLocalizations.of(context)!;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        String localSelectedValue = selectedValue;
        double localVolume = volume;

        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 12,
                right: 12,
                top: 12,
                bottom: MediaQuery.of(context).viewInsets.bottom + 12,
              ),
              child: SafeArea(
                top: false,
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 42,
                          height: 5,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.outlineVariant,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _PrecisionPreviewCard(
                          title: title,
                          caption: caption,
                          options: options,
                          selectedValue: localSelectedValue,
                          volume: localVolume,
                          valueUnitLabel: valueUnitLabel,
                          onSelected: (value) {
                            setSheetState(() => localSelectedValue = value);
                            onSelected(value);
                          },
                          onVolumeChanged: (value) {
                            setSheetState(() => localVolume = value);
                            onVolumeChanged(value);
                          },
                          stage: stageBuilder(localSelectedValue, localVolume),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: () => Navigator.of(context).pop(),
                            child: Text(l10n.done),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  String _consentText(AppLocalizations l10n) {
    return switch (_consentValue) {
      'yes' => l10n.consentAgreed,
      'no' => l10n.consentDeclined,
      '' => l10n.consentNotSet,
      null => l10n.consentUnavailable,
      _ => l10n.consentNotSet,
    };
  }

  Map<String, String> _padOptions(AppLocalizations l10n) => {
    'liner': l10n.padLiner,
    'day': l10n.padDay,
    'night': l10n.padNight,
    'pants': l10n.padPants,
  };

  Map<String, String> _tamponOptions(AppLocalizations l10n) => {
    'mini': l10n.tamponMini,
    'regular': l10n.tamponRegular,
    'large': l10n.tamponLarge,
    'super': l10n.tamponSuper,
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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
    final consentText = _consentText(l10n);
    final padOptions = _padOptions(l10n);
    final tamponOptions = _tamponOptions(l10n);

    return FlowPage(
      title: l10n.settingsTitle,
      subtitle: l10n.settingsSubtitle,
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
                          : l10n.signedInAccount,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 6),
                    Text(userEmail ?? l10n.unknown),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(
                          label: Text(
                            useTampon
                                ? l10n.showTamponRecords
                                : l10n.hideTamponRecords,
                          ),
                        ),
                        Chip(label: Text(l10n.researchConsent(consentText))),
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
                  l10n.accountSection,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(userEmail ?? l10n.unknown),
                const SizedBox(height: 16),
                TextField(
                  controller: _displayNameController,
                  decoration: InputDecoration(labelText: l10n.nickname),
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
                              SnackBar(content: Text(l10n.nicknameSaved)),
                            );
                          } finally {
                            if (mounted) {
                              setState(() => _updatingProfile = false);
                            }
                          }
                        },
                  child: Text(
                    _updatingProfile ? l10n.saving : l10n.saveNickname,
                  ),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l10n.tamponHabit),
                  subtitle: Text(l10n.tamponHabitHint),
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
                  l10n.privacyLanguageSection,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8F1EC),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Text(l10n.researchConsentStatus(consentText)),
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
                  child: Text(l10n.editResearchConsent),
                ),
                const SizedBox(height: 16),
                Text(l10n.language),
                const SizedBox(height: 8),
                const LanguageSwitcher(
                  variant: LanguageSwitcherVariant.segmented,
                ),
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
                        l10n.recordDisplaySection,
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
                        title: Text(l10n.showPadModule),
                        subtitle: Text(l10n.showPadModuleHint),
                        value: _showPad,
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _showPad;
                                setState(() => _showPad = value);
                                _runPrefsSave(
                                  persist: _saveVisibility,
                                  rollback: () => _showPad = previous,
                                  successText: l10n.displaySettingsSaved,
                                );
                              },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(l10n.showRealtimeBleeding),
                        subtitle: Text(l10n.showRealtimeBleedingHint),
                        value: _showBleeding,
                        onChanged: _savingPrefs
                            ? null
                            : (value) {
                                final previous = _showBleeding;
                                setState(() => _showBleeding = value);
                                _runPrefsSave(
                                  persist: _saveVisibility,
                                  rollback: () => _showBleeding = previous,
                                  successText: l10n.displaySettingsSaved,
                                );
                              },
                      ),
                      const Divider(height: 28),
                      Text(
                        l10n.inputMode,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        l10n.inputModeHint,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.62),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(l10n.padPrecisionMode),
                        subtitle: Text(
                          _padInputMode == 'drag'
                              ? l10n.dragSliderInput
                              : l10n.quickButtonInput,
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
                                  successText: l10n.inputModeSaved,
                                );
                              },
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(l10n.tamponPrecisionMode),
                        subtitle: Text(
                          _tamponInputMode == 'drag'
                              ? l10n.dragSliderInput
                              : l10n.quickButtonInput,
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
                                  successText: l10n.inputModeSaved,
                                );
                              },
                      ),
                      const SizedBox(height: 12),
                      _PreviewActionTile(
                        previewLabel: l10n.preview,
                        title: l10n.padPrecisionPreview,
                        subtitle: _padInputMode == 'drag'
                            ? l10n.previewSpecifications
                            : l10n.previewEnabledEffect,
                        onTap: () => _showPrecisionPreviewSheet(
                          title: l10n.padPreviewTitle,
                          caption: _padInputMode == 'drag'
                              ? l10n.precisionEnabledCaption
                              : l10n.quickModeCaption,
                          options: padOptions,
                          selectedValue: _padPreviewType,
                          volume: _padPreviewVolume,
                          valueUnitLabel: l10n.padUnit,
                          onSelected: (value) =>
                              setState(() => _padPreviewType = value),
                          onVolumeChanged: (value) =>
                              setState(() => _padPreviewVolume = value),
                          stageBuilder: (selectedValue, volume) =>
                              _PadPrecisionStage(
                                padType: selectedValue,
                                volume: volume,
                                l10n: l10n,
                              ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _PreviewActionTile(
                        previewLabel: l10n.preview,
                        title: l10n.tamponPrecisionPreview,
                        subtitle: _tamponInputMode == 'drag'
                            ? l10n.previewTamponHeight
                            : l10n.previewEnabledEffect,
                        onTap: () => _showPrecisionPreviewSheet(
                          title: l10n.tamponPreviewTitle,
                          caption: _tamponInputMode == 'drag'
                              ? l10n.tamponPrecisionEnabledCaption
                              : l10n.quickModeCaption,
                          options: tamponOptions,
                          selectedValue: _tamponPreviewModel,
                          volume: _tamponPreviewVolume,
                          valueUnitLabel: l10n.tamponUnit,
                          onSelected: (value) =>
                              setState(() => _tamponPreviewModel = value),
                          onVolumeChanged: (value) =>
                              setState(() => _tamponPreviewVolume = value),
                          stageBuilder: (selectedValue, volume) =>
                              _TamponPrecisionStage(
                                model: selectedValue,
                                volume: volume,
                                l10n: l10n,
                              ),
                        ),
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
                  l10n.supportFeedbackSection,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => context.go('/feedback'),
                  child: Text(l10n.submitFeedback),
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
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _deletingAccount || userEmail == null
                      ? null
                      : () => _confirmDeleteAccount(userEmail),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  child: Text(
                    _deletingAccount ? l10n.deleting : l10n.deleteAccount,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PreviewActionTile extends StatelessWidget {
  const _PreviewActionTile({
    required this.previewLabel,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String previewLabel;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF9F3EE),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE7DAD2)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.62),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              previewLabel,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.chevron_right_rounded,
              color: Theme.of(context).colorScheme.primary,
            ),
          ],
        ),
      ),
    );
  }
}

class _PrecisionPreviewCard extends StatelessWidget {
  const _PrecisionPreviewCard({
    required this.title,
    required this.caption,
    required this.options,
    required this.selectedValue,
    required this.volume,
    required this.valueUnitLabel,
    required this.onSelected,
    required this.onVolumeChanged,
    required this.stage,
  });

  final String title;
  final String caption;
  final Map<String, String> options;
  final String selectedValue;
  final double volume;
  final String valueUnitLabel;
  final ValueChanged<String> onSelected;
  final ValueChanged<double> onVolumeChanged;
  final Widget stage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F3EE),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE7DAD2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            caption,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.66),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          stage,
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final entry in options.entries)
                ChoiceChip(
                  label: Text(entry.value),
                  selected: selectedValue == entry.key,
                  onSelected: (_) => onSelected(entry.key),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Text(
                l10n.bleedingVolume(volume.toStringAsFixed(1)),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                valueUnitLabel,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.56),
                ),
              ),
            ],
          ),
          Slider(
            value: volume,
            min: 1,
            max: 20,
            divisions: 190,
            label: '${volume.toStringAsFixed(1)}mL',
            onChanged: onVolumeChanged,
          ),
          Row(
            children: [
              _ScaleHint(label: l10n.volumeLow, value: '3mL'),
              const Spacer(),
              _ScaleHint(label: l10n.volumeMedium, value: '6mL'),
              const Spacer(),
              _ScaleHint(label: l10n.volumeHigh, value: '10mL'),
            ],
          ),
        ],
      ),
    );
  }
}

class _ScaleHint extends StatelessWidget {
  const _ScaleHint({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(
      context,
    ).colorScheme.onSurface.withValues(alpha: 0.54);
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 11, color: color)),
      ],
    );
  }
}

class _PadPrecisionStage extends StatelessWidget {
  const _PadPrecisionStage({
    required this.padType,
    required this.volume,
    required this.l10n,
  });

  final String padType;
  final double volume;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final palette = _bloodPalette();
    final size = _padBodySize(padType);
    final stain = _padStainSize(volume, size);
    final showPants = padType == 'pants';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFBF8), Color(0xFFF4E7DE)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 220),
            style: Theme.of(context).textTheme.bodySmall!.copyWith(
              color: const Color(0xFF7F6056),
              fontWeight: FontWeight.w700,
            ),
            child: Text(
              '${_padTypeName(l10n, padType)} · ${volume.toStringAsFixed(1)}mL',
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 170,
            height: 210,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  left: 20,
                  child: _PadWing(alignment: Alignment.centerRight),
                ),
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  right: 20,
                  child: _PadWing(alignment: Alignment.centerLeft),
                ),
                if (showPants)
                  Positioned(
                    top: 16,
                    child: Container(
                      width: 132,
                      height: 162,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(60),
                        border: Border.all(
                          color: const Color(0xFFD8C8C0),
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                Container(
                  width: size.width,
                  height: size.height,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(42),
                    border: Border.all(color: const Color(0xFFE3D5CE)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 24,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                ),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 240),
                  curve: Curves.easeOutCubic,
                  width: size.width * 0.34,
                  height: size.height * 0.74,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF6EFEB),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: stain.opacity),
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, child) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 260),
                      curve: Curves.easeOutCubic,
                      width: stain.width,
                      height: stain.height,
                      decoration: BoxDecoration(
                        color: palette.fill.withValues(alpha: value),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: palette.outline.withValues(
                            alpha: value.clamp(0.16, 0.42),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PadWing extends StatelessWidget {
  const _PadWing({required this.alignment});

  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: alignment == Alignment.centerRight ? -0.24 : 0.24,
      child: Container(
        width: 34,
        height: 70,
        decoration: BoxDecoration(
          color: const Color(0xFFF8F3EF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE3D5CE)),
        ),
      ),
    );
  }
}

class _TamponPrecisionStage extends StatelessWidget {
  const _TamponPrecisionStage({
    required this.model,
    required this.volume,
    required this.l10n,
  });

  final String model;
  final double volume;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final palette = _bloodPalette();
    final wetPercent = _tamponWetPercent(volume);
    final bodyHeight = _tamponBodyHeight(model);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFBF8), Color(0xFFF4E7DE)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          Text(
            '${_tamponModelName(l10n, model)} · ${volume.toStringAsFixed(1)}mL',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: const Color(0xFF7F6056),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 170,
            height: 210,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(
                  top: 18,
                  child: Container(
                    width: 58,
                    height: bodyHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(color: const Color(0xFFE3D5CE)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x12000000),
                          blurRadius: 22,
                          offset: Offset(0, 10),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: TweenAnimationBuilder<double>(
                        tween: Tween<double>(begin: 0, end: wetPercent),
                        duration: const Duration(milliseconds: 260),
                        curve: Curves.easeOutCubic,
                        builder: (context, value, child) {
                          return Container(
                            width: double.infinity,
                            height: bodyHeight * value,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  palette.fill,
                                  palette.fill.withValues(alpha: 0.58),
                                ],
                              ),
                            ),
                            child: Align(
                              alignment: Alignment.topCenter,
                              child: Container(
                                width: double.infinity,
                                height: 6,
                                color: palette.outline.withValues(alpha: 0.34),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 56,
                  child: Container(
                    width: 18,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1E7E2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFD9CCC5)),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 10,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: wetPercent),
                    duration: const Duration(milliseconds: 260),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, child) {
                      return Container(
                        width: 2,
                        height: 56 + value * 12,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0C7BF),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

({Color fill, Color outline}) _bloodPalette() =>
    (fill: const Color(0xFFC35A63), outline: const Color(0xFF8C3745));

Size _padBodySize(String padType) {
  switch (padType) {
    case 'liner':
      return const Size(58, 116);
    case 'night':
      return const Size(66, 162);
    case 'pants':
      return const Size(68, 152);
    case 'day':
    default:
      return const Size(64, 138);
  }
}

({double width, double height, double opacity}) _padStainSize(
  double volume,
  Size body,
) {
  final progress = ((volume.clamp(1, 20) - 1) / 19).clamp(0.0, 1.0);
  final width = body.width * (0.18 + progress * 0.56);
  final height = body.height * (0.18 + progress * 0.70);
  final opacity = 0.28 + progress * 0.52;
  return (width: width, height: height, opacity: opacity);
}

double _tamponWetPercent(double volume) {
  final progress = ((volume.clamp(1, 20) - 1) / 19).clamp(0.0, 1.0);
  return 0.10 + progress * 0.90;
}

double _tamponBodyHeight(String model) {
  switch (model) {
    case 'mini':
      return 96;
    case 'large':
      return 128;
    case 'super':
      return 142;
    case 'regular':
    default:
      return 112;
  }
}

String _padTypeName(AppLocalizations l10n, String value) {
  return switch (value) {
    'liner' => l10n.padLiner,
    'day' => l10n.padDay,
    'night' => l10n.padNight,
    'pants' => l10n.padPants,
    _ => l10n.pad,
  };
}

String _tamponModelName(AppLocalizations l10n, String value) {
  return switch (value) {
    'mini' => l10n.tamponMini,
    'regular' => l10n.tamponRegular,
    'large' => l10n.tamponLarge,
    'super' => l10n.tamponSuper,
    _ => l10n.tampon,
  };
}
