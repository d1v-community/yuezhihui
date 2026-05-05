import '../../../core/network/api_client.dart';

class FeedbackApi {
  FeedbackApi(this._client);

  final ApiClient _client;

  Future<void> submit({
    required int typeIndex,
    required String content,
    String? contact,
  }) async {
    await _client.post('/api/feedback', body: {
      'typeIndex': typeIndex,
      'content': content,
      if (contact != null && contact.isNotEmpty) 'contact': contact,
      'meta': {'platform': 'flutter'},
    });
  }
}
