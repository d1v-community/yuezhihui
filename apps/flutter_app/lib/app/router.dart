import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/session/session_controller.dart';
import '../features/analysis/presentation/analysis_page.dart';
import '../features/analysis/presentation/cycle_detail_page.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/encyclopedia/presentation/encyclopedia_page.dart';
import '../features/feedback/presentation/feedback_page.dart';
import '../features/home/presentation/home_page.dart';
import '../features/onboarding/presentation/onboarding_page.dart';
import '../features/settings/presentation/settings_page.dart';
import '../features/shell/presentation/app_shell.dart';

final routerRefreshProvider = Provider<RouterRefreshNotifier>((ref) {
  final notifier = RouterRefreshNotifier(ref);
  ref.onDispose(notifier.dispose);
  return notifier;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(routerRefreshProvider);
  const publicPaths = {'/login', '/doc', '/encyclopedia'};
  return GoRouter(
    initialLocation: '/boot',
    refreshListenable: refresh,
    redirect: (context, state) {
      final session = ref.read(sessionControllerProvider);
      final path = state.uri.path;
      if (session.status == SessionStatus.loading) {
        return path == '/boot' ? null : '/boot';
      }
      if (session.status == SessionStatus.loggedOut) {
        return publicPaths.contains(path) ? null : '/login';
      }
      if (session.status == SessionStatus.onboardingRequired) {
        return path == '/onboarding' ? null : '/onboarding';
      }
      final editMode = state.uri.queryParameters['mode'] == 'edit';
      if (path == '/boot' ||
          path == '/login' ||
          path == '/doc' ||
          (path == '/onboarding' && !editMode)) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/boot', builder: (context, state) => const BootPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/doc',
        builder: (context, state) =>
            PublicDocPage(initialCardId: state.uri.queryParameters['entry']),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const HomePage()),
          GoRoute(
            path: '/analysis',
            builder: (context, state) => const AnalysisPage(),
          ),
          GoRoute(
            path: '/analysis/cycle/:cycleId',
            builder: (context, state) {
              final cycleId =
                  int.tryParse(state.pathParameters['cycleId'] ?? '') ?? 0;
              return CycleDetailPage(cycleId: cycleId);
            },
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsPage(),
          ),
          GoRoute(
            path: '/encyclopedia',
            builder: (context, state) => const EncyclopediaPage(),
          ),
          GoRoute(
            path: '/feedback',
            builder: (context, state) => const FeedbackPage(),
          ),
        ],
      ),
    ],
  );
});

class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(this.ref) {
    ref.listen(
      sessionControllerProvider,
      (previous, next) => notifyListeners(),
    );
  }

  final Ref ref;
}

class BootPage extends ConsumerStatefulWidget {
  const BootPage({super.key});

  @override
  ConsumerState<BootPage> createState() => _BootPageState();
}

class _BootPageState extends ConsumerState<BootPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(sessionControllerProvider.notifier).bootstrap(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF6E9E4), Color(0xFFE9D2D3), Color(0xFFD8C4D5)],
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/branding/app_logo_master.png',
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('月知会', style: theme.textTheme.titleLarge),
                    const SizedBox(height: 12),
                    const CircularProgressIndicator(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PublicDocPage extends StatelessWidget {
  const PublicDocPage({super.key, this.initialCardId});

  final String? initialCardId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF7EEE7), Color(0xFFF2E4DD), Color(0xFFEDE3E6)],
          ),
        ),
        child: SafeArea(child: EncyclopediaPage(initialCardId: initialCardId)),
      ),
    );
  }
}
