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
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFF9EEE8), Color(0xFFF4E4E3), Color(0xFFF0E6EA)],
          ),
        ),
        child: SafeArea(child: child),
      ),
      bottomNavigationBar: NavigationBar(
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
    );
  }
}
