import '../../../core/network/api_client.dart';

class UserApi {
  UserApi(this._client);

  final ApiClient _client;

  Future<void> updateProfile({String? displayName, bool? useTampon}) async {
    await _client.patch(
      '/api/user/profile',
      body: {
        ...?displayName == null ? null : {'displayName': displayName},
        ...?useTampon == null ? null : {'useTampon': useTampon},
      },
    );
  }
}
