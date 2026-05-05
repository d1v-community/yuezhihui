import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/analysis/data/analysis_api.dart';
import '../../features/auth/data/auth_api.dart';
import '../../features/feedback/data/feedback_api.dart';
import '../../features/menstrual/data/menstrual_api.dart';
import '../../features/onboarding/data/onboarding_api.dart';
import '../../features/share/data/share_api.dart';
import '../../features/user/data/user_api.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';
import '../storage/app_storage.dart';

enum SessionStatus {
  loading,
  loggedOut,
  onboardingRequired,
  ready,
}

class SessionUser {
  const SessionUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.useTampon,
  });

  final String id;
  final String? email;
  final String? displayName;
  final bool useTampon;
}

@immutable
class SessionState {
  const SessionState({
    required this.status,
    required this.isBusy,
    required this.apiBaseUrl,
    this.user,
    this.token,
    this.errorMessage,
  });

  final SessionStatus status;
  final bool isBusy;
  final String apiBaseUrl;
  final SessionUser? user;
  final String? token;
  final String? errorMessage;

  SessionState copyWith({
    SessionStatus? status,
    bool? isBusy,
    String? apiBaseUrl,
    SessionUser? user,
    String? token,
    String? errorMessage,
    bool clearError = false,
  }) {
    return SessionState(
      status: status ?? this.status,
      isBusy: isBusy ?? this.isBusy,
      apiBaseUrl: apiBaseUrl ?? this.apiBaseUrl,
      user: user ?? this.user,
      token: token ?? this.token,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }

  factory SessionState.initial() {
    return SessionState(
      status: SessionStatus.loading,
      isBusy: false,
      apiBaseUrl: AppConfig.apiBaseUrl,
    );
  }
}

final appStorageProvider = FutureProvider<AppStorage>((ref) async {
  return AppStorage.create();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    baseUrl: AppConfig.apiBaseUrl,
    tokenProvider: () async {
      final storage = await ref.read(appStorageProvider.future);
      return storage.getAuthToken();
    },
  );
});

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(apiClientProvider));
});

final onboardingApiProvider = Provider<OnboardingApi>((ref) {
  return OnboardingApi(ref.watch(apiClientProvider));
});

final analysisApiProvider = Provider<AnalysisApi>((ref) {
  return AnalysisApi(ref.watch(apiClientProvider));
});

final menstrualApiProvider = Provider<MenstrualApi>((ref) {
  return MenstrualApi(ref.watch(apiClientProvider));
});

final userApiProvider = Provider<UserApi>((ref) {
  return UserApi(ref.watch(apiClientProvider));
});

final feedbackApiProvider = Provider<FeedbackApi>((ref) {
  return FeedbackApi(ref.watch(apiClientProvider));
});

final shareApiProvider = Provider<ShareApi>((ref) {
  return ShareApi(ref.watch(apiClientProvider));
});

final sessionControllerProvider = NotifierProvider<SessionController, SessionState>(SessionController.new);

class SessionController extends Notifier<SessionState> {
  @override
  SessionState build() {
    Future.microtask(bootstrap);
    return SessionState.initial();
  }

  Future<void> bootstrap() async {
    state = state.copyWith(status: SessionStatus.loading, isBusy: false, clearError: true);
    final storage = await ref.read(appStorageProvider.future);
    final token = storage.getAuthToken();
    if (token == null || token.isEmpty) {
      state = state.copyWith(status: SessionStatus.loggedOut, token: null, user: null, clearError: true);
      return;
    }
    await _loadSessionFromServer(token);
  }

  Future<void> sendCode(String email) async {
    state = state.copyWith(isBusy: true, clearError: true);
    try {
      await ref.read(authApiProvider).sendCode(email);
      state = state.copyWith(isBusy: false, clearError: true);
    } catch (e) {
      state = state.copyWith(isBusy: false, errorMessage: _readError(e));
      rethrow;
    }
  }

  Future<void> verifyLogin(String email, String code) async {
    state = state.copyWith(isBusy: true, clearError: true);
    try {
      final result = await ref.read(authApiProvider).verifyLogin(email, code);
      final storage = await ref.read(appStorageProvider.future);
      await storage.setAuthToken(result.token);
      await _loadSessionFromServer(result.token);
    } catch (e) {
      state = state.copyWith(isBusy: false, errorMessage: _readError(e));
      rethrow;
    }
  }

  Future<void> refreshSession() async {
    final token = state.token;
    if (token == null || token.isEmpty) {
      await bootstrap();
      return;
    }
    state = state.copyWith(isBusy: true, clearError: true);
    try {
      await _loadSessionFromServer(token);
    } catch (e) {
      state = state.copyWith(isBusy: false, errorMessage: _readError(e));
    }
  }

  Future<void> logout() async {
    final storage = await ref.read(appStorageProvider.future);
    await storage.clearAuthToken();
    state = state.copyWith(
      status: SessionStatus.loggedOut,
      isBusy: false,
      token: null,
      user: null,
      clearError: true,
    );
  }

  Future<void> markOnboardingCompleted() async {
    state = state.copyWith(status: SessionStatus.ready, clearError: true);
  }

  Future<void> _loadSessionFromServer(String token) async {
    try {
      final me = await ref.read(authApiProvider).me();
      if (!me.authenticated || me.user == null) {
        await logout();
        return;
      }

      final onboardingState = await ref.read(onboardingApiProvider).state();
      final user = me.user!;
      state = state.copyWith(
        status: onboardingState.completed ? SessionStatus.ready : SessionStatus.onboardingRequired,
        isBusy: false,
        token: token,
        user: SessionUser(
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          useTampon: user.useTampon ?? true,
        ),
        clearError: true,
      );
    } catch (e) {
      await logout();
      state = state.copyWith(errorMessage: _readError(e));
    }
  }

  String _readError(Object error) {
    if (error is ApiException) return error.message;
    return 'Unexpected error';
  }
}
