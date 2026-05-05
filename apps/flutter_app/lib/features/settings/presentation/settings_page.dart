import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/app_config.dart';
import '../../../core/i18n/locale_controller.dart';
import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  final _displayNameController = TextEditingController();
  bool _updating = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(sessionControllerProvider).user;
    _displayNameController.text = user?.displayName ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeState = ref.watch(localeControllerProvider);
    final session = ref.watch(sessionControllerProvider);

    return FlowPage(
      title: l10n.settingsTitle,
      subtitle: l10n.settingsSubtitle,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.language, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                SegmentedButton<String?>(
                  segments: [
                    ButtonSegment(value: null, label: Text(l10n.languageSystem)),
                    ButtonSegment(value: 'zh', label: Text(l10n.languageZh)),
                    ButtonSegment(value: 'en', label: Text(l10n.languageEn)),
                  ],
                  selected: {localeState.locale?.languageCode},
                  onSelectionChanged: (selection) {
                    ref.read(localeControllerProvider.notifier).setLocale(selection.firstOrNull);
                  },
                ),
                const SizedBox(height: 20),
                Text('${l10n.apiBaseUrl}: ${AppConfig.apiBaseUrl}'),
                const SizedBox(height: 8),
                Text(l10n.copyTokenHint),
                const SizedBox(height: 16),
                TextField(
                  controller: _displayNameController,
                  decoration: const InputDecoration(labelText: '昵称'),
                ),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: _updating
                      ? null
                      : () async {
                          setState(() => _updating = true);
                          try {
                            await ref.read(userApiProvider).updateProfile(displayName: _displayNameController.text.trim());
                            await ref.read(sessionControllerProvider.notifier).refreshSession();
                          } finally {
                            if (mounted) setState(() => _updating = false);
                          }
                        },
                  child: Text(_updating ? '保存中...' : '保存昵称'),
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
                Text(session.user?.email ?? l10n.unknown, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(session.status == SessionStatus.ready ? l10n.authenticated : l10n.notAuthenticated),
                const SizedBox(height: 16),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l10n.useTampon),
                  value: session.user?.useTampon ?? true,
                  onChanged: (value) async {
                    await ref.read(userApiProvider).updateProfile(useTampon: value);
                    await ref.read(sessionControllerProvider.notifier).refreshSession();
                  },
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: () => context.go('/feedback'),
                  child: const Text('提交反馈'),
                ),
                const SizedBox(height: 12),
                FilledButton.tonal(
                  onPressed: () async {
                    await ref.read(sessionControllerProvider.notifier).logout();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.loggedOut)),
                      );
                    }
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
