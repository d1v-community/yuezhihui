import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  int _indexFor(String location) {
    if (location.startsWith('/analysis')) return 1;
    if (location.startsWith('/encyclopedia')) return 2;
    if (location.startsWith('/settings')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final location = GoRouterState.of(context).uri.toString();
    final currentIndex = _indexFor(location);

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
        child: SafeArea(child: child),
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
                  icon: const Icon(Icons.water_drop_outlined),
                  label: l10n.homeTab,
                ),
                NavigationDestination(
                  icon: const Icon(Icons.insights_outlined),
                  label: l10n.analysisTab,
                ),
                const NavigationDestination(
                  icon: Icon(Icons.menu_book_outlined),
                  label: '百科',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.tune_outlined),
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
