import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/locale_controller.dart';
import '../../../l10n/app_localizations.dart';

enum LanguageSwitcherVariant { compact, segmented }

class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({
    super.key,
    this.variant = LanguageSwitcherVariant.compact,
  });

  final LanguageSwitcherVariant variant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final languageCode = ref.watch(
      localeControllerProvider.select((state) => state.locale?.languageCode),
    );

    return switch (variant) {
      LanguageSwitcherVariant.compact => _CompactLanguageSwitcher(
        languageCode: languageCode,
        l10n: l10n,
        onChanged: (value) => _setLocale(ref, value),
      ),
      LanguageSwitcherVariant.segmented => SegmentedButton<String?>(
        segments: [
          ButtonSegment(value: null, label: Text(l10n.languageSystem)),
          ButtonSegment(value: 'zh', label: Text(l10n.languageZh)),
          ButtonSegment(value: 'en', label: Text(l10n.languageEn)),
        ],
        selected: {languageCode},
        onSelectionChanged: (selection) {
          _setLocale(ref, selection.firstOrNull);
        },
      ),
    };
  }

  void _setLocale(WidgetRef ref, String? languageCode) {
    ref.read(localeControllerProvider.notifier).setLocale(languageCode);
  }
}

class _CompactLanguageSwitcher extends StatelessWidget {
  const _CompactLanguageSwitcher({
    required this.languageCode,
    required this.l10n,
    required this.onChanged,
  });

  final String? languageCode;
  final AppLocalizations l10n;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: l10n.language,
      onSelected: (value) => onChanged(value == 'system' ? null : value),
      itemBuilder: (context) => [
        _item('system', l10n.languageSystem, languageCode == null),
        _item('zh', l10n.languageZh, languageCode == 'zh'),
        _item('en', l10n.languageEn, languageCode == 'en'),
      ],
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.84),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.74)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.language_rounded,
                size: 18,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 7),
              Text(
                _label,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  PopupMenuItem<String> _item(String value, String label, bool selected) {
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(selected ? Icons.check_rounded : null, size: 18),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }

  String get _label {
    return switch (languageCode) {
      'zh' => l10n.languageZh,
      'en' => l10n.languageEn,
      _ => l10n.languageSystem,
    };
  }
}
