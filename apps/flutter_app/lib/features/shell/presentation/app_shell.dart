import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  int _indexFor(String location) {
    if (location.startsWith('/analysis')) return 1;
    if (location.startsWith('/encyclopedia')) return 2;
    if (location.startsWith('/settings')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final location = GoRouterState.of(context).uri.toString();
    final currentIndex = _indexFor(location);
    final isGuest = ref.watch(
      sessionControllerProvider.select(
        (state) => state.status == SessionStatus.loggedOut,
      ),
    );

    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF7EEE7), Color(0xFFF2E4DD), Color(0xFFEDE3E6)],
          ),
          boxShadow: [
            BoxShadow(
              color: Theme.of(
                context,
              ).colorScheme.primary.withValues(alpha: 0.03),
              blurRadius: 120,
              offset: const Offset(0, -20),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 260),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) {
                  final offset = Tween<Offset>(
                    begin: const Offset(0, -0.08),
                    end: Offset.zero,
                  ).animate(animation);
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(position: offset, child: child),
                  );
                },
                child: isGuest
                    ? Container(
                        key: const ValueKey('guest-banner'),
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8EEE8),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outlineVariant,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lock_open_rounded, size: 18),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text('当前是游客模式：百科可直接看，记录与分析需要登录。'),
                            ),
                            TextButton(
                              onPressed: () => context.go('/login'),
                              child: const Text('去登录'),
                            ),
                          ],
                        ),
                      )
                    : const SizedBox(key: ValueKey('guest-banner-empty')),
              ),
              Expanded(
                child: ClipRect(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 320),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeInCubic,
                    transitionBuilder: (child, animation) {
                      final offset = Tween<Offset>(
                        begin: const Offset(0.06, 0),
                        end: Offset.zero,
                      ).animate(animation);
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(position: offset, child: child),
                      );
                    },
                    child: KeyedSubtree(
                      key: ValueKey(currentIndex),
                      child: child,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: NavigationBar(
              selectedIndex: currentIndex,
              onDestinationSelected: (index) {
                if (isGuest && index != 2) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('登录后可用记录、分析和设置')),
                  );
                  context.go('/login');
                  return;
                }
                switch (index) {
                  case 0:
                    context.go('/home');
                    break;
                  case 1:
                    context.go('/analysis');
                    break;
                  case 2:
                    context.go('/encyclopedia');
                    break;
                  case 3:
                    context.go('/settings');
                    break;
                }
              },
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.edit_note_outlined),
                  selectedIcon: const Icon(Icons.edit_note_rounded),
                  label: l10n.homeTab,
                ),
                NavigationDestination(
                  icon: const Icon(Icons.ssid_chart_outlined),
                  selectedIcon: const Icon(Icons.ssid_chart_rounded),
                  label: l10n.analysisTab,
                ),
                const NavigationDestination(
                  icon: Icon(Icons.auto_stories_outlined),
                  selectedIcon: Icon(Icons.auto_stories_rounded),
                  label: '百科',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.account_circle_outlined),
                  selectedIcon: const Icon(Icons.account_circle_rounded),
                  label: l10n.settingsTab,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
