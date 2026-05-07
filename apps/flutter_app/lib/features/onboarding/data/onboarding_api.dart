import '../../../core/network/api_client.dart';
import '../../../core/utils/json_utils.dart';

class OnboardingApi {
  OnboardingApi(this._client);

  final ApiClient _client;

  Future<OnboardingStateResult> state() async {
    final json = await _client.get('/api/onboarding/v2/state');
    final session = asStringMap(json['session']);
    final completed = session?['status']?.toString() == 'completed';
    return OnboardingStateResult(
      completed: completed,
      currentQuestionId: session?['currentQuestionId']?.toString(),
      answers: asStringMapOrEmpty(json['answers']),
    );
  }

  Future<OnboardingStartResult> start() async {
    final json = await _client.post('/api/onboarding/v2/start', body: {});
    final session = asStringMap(json['session']);
    return OnboardingStartResult(
      currentQuestionId: session?['currentQuestionId']?.toString(),
      answers: asStringMapOrEmpty(json['answers']),
    );
  }

  Future<OnboardingNextResult> answer({
    required String questionId,
    required Map<String, dynamic> answer,
  }) async {
    final json = await _client.post(
      '/api/onboarding/v2/answer',
      body: {'questionId': questionId, 'answer': answer},
    );
    return OnboardingNextResult(
      nextQuestionId: json['nextQuestionId']?.toString(),
      success: json['success'] == true,
    );
  }

  Future<OnboardingPositionResult> position(String? questionId) async {
    final json = await _client.post(
      '/api/onboarding/v2/position',
      body: {'currentQuestionId': questionId},
    );
    return OnboardingPositionResult(
      currentQuestionId: json['currentQuestionId']?.toString(),
      success: json['success'] == true,
    );
  }

  Future<bool> submit() async {
    final json = await _client.post('/api/onboarding/v2/submit', body: {});
    return json['success'] == true;
  }
}

class OnboardingStateResult {
  const OnboardingStateResult({
    required this.completed,
    required this.currentQuestionId,
    required this.answers,
  });

  final bool completed;
  final String? currentQuestionId;
  final Map<String, dynamic> answers;
}

class OnboardingStartResult {
  const OnboardingStartResult({
    required this.currentQuestionId,
    required this.answers,
  });

  final String? currentQuestionId;
  final Map<String, dynamic> answers;
}

class OnboardingNextResult {
  const OnboardingNextResult({
    required this.nextQuestionId,
    required this.success,
  });

  final String? nextQuestionId;
  final bool success;
}

class OnboardingPositionResult {
  const OnboardingPositionResult({
    required this.currentQuestionId,
    required this.success,
  });

  final String? currentQuestionId;
  final bool success;
}
