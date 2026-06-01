import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  Future<void> _promptLogin(BuildContext context) async {
    HapticFeedback.lightImpact();
    final shouldLogin = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => const _LoginPromptSheet(),
    );
    if (shouldLogin == true && context.mounted) {
      context.go('/login');
    }
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
                            Expanded(child: Text(l10n.guestBanner)),
                            TextButton(
                              onPressed: () => _promptLogin(context),
                              child: Text(l10n.goToLogin),
                            ),
                          ],
                        ),
                      )
                    : const SizedBox(key: ValueKey('guest-banner-empty')),
              ),
              Expanded(
                child: ClipRect(
                  child: TweenAnimationBuilder<double>(
                    key: ValueKey(currentIndex),
                    tween: Tween(begin: 0, end: 1),
                    duration: const Duration(milliseconds: 260),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, child) {
                      final dx = (1 - value) * 24;
                      return Opacity(
                        opacity: value,
                        child: Transform.translate(
                          offset: Offset(dx, 0),
                          child: child,
                        ),
                      );
                    },
                    child: child,
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
              onDestinationSelected: (index) async {
                if (isGuest && index != 2) {
                  await _promptLogin(context);
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
                NavigationDestination(
                  icon: const Icon(Icons.auto_stories_outlined),
                  selectedIcon: const Icon(Icons.auto_stories_rounded),
                  label: l10n.encyclopediaTab,
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

class _LoginPromptSheet extends StatelessWidget {
  const _LoginPromptSheet();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 18),
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.96, end: 1),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutBack,
        builder: (context, value, child) => Transform.scale(
          scale: value,
          child: Opacity(opacity: value.clamp(0.0, 1.0), child: child),
        ),
        child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFAF8), Color(0xFFF6E9E3), Color(0xFFF1DFDF)],
            ),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withValues(alpha: 0.72)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 30,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(
                          alpha: 0.18,
                        ),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.72),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.asset(
                            'assets/branding/app_logo_master.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.continueAfterLogin,
                              style: theme.textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              l10n.brandName,
                              style: theme.textTheme.labelLarge?.copyWith(
                                color: theme.colorScheme.primary,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(l10n.loginRequired, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    l10n.loginBenefitDescription,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(
                        alpha: 0.74,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _PromptBenefit(
                    icon: Icons.edit_note_rounded,
                    text: l10n.loginBenefitRecords,
                  ),
                  const SizedBox(height: 10),
                  _PromptBenefit(
                    icon: Icons.ssid_chart_rounded,
                    text: l10n.loginBenefitAnalysis,
                  ),
                  const SizedBox(height: 10),
                  _PromptBenefit(
                    icon: Icons.sync_rounded,
                    text: l10n.loginBenefitSync,
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: Text(l10n.browseFirst),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          child: Text(l10n.goToLogin),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PromptBenefit extends StatelessWidget {
  const _PromptBenefit({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.64),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.82),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
