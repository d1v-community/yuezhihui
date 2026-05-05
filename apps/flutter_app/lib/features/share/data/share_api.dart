import '../../../core/network/api_client.dart';

class ShareApi {
  ShareApi(this._client);

  final ApiClient _client;

  Future<ShareResult> createOverview({int limit = 6}) async {
    final json = await _client.post('/api/share', body: {
      'type': 'overview',
      'limit': limit,
    });
    return ShareResult.fromJson(json['data'] as Map<String, dynamic>? ?? const {});
  }

  Future<ShareResult> createPeriod(int cycleId) async {
    final json = await _client.post('/api/share', body: {
      'type': 'period',
      'cycleId': cycleId,
    });
    return ShareResult.fromJson(json['data'] as Map<String, dynamic>? ?? const {});
  }
}

class ShareResult {
  ShareResult({
    required this.shareCode,
    required this.path,
    required this.expireAt,
  });

  final String shareCode;
  final String path;
  final String expireAt;

  factory ShareResult.fromJson(Map<String, dynamic> json) {
    return ShareResult(
      shareCode: json['shareCode']?.toString() ?? '',
      path: json['path']?.toString() ?? '',
      expireAt: json['expireAt']?.toString() ?? '',
    );
  }
}
