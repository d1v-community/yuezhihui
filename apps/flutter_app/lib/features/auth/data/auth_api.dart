import '../../../core/network/api_client.dart';

class AuthApi {
  AuthApi(this._client);

  final ApiClient _client;

  Future<SendCodeResult> sendCode(String email) async {
    final json = await _client.post(
      '/api/auth/send-code',
      body: {'email': email},
    );
    if (json['success'] != true) {
      throw ApiException(
        statusCode: 400,
        message: (json['error'] ?? 'Failed to send code').toString(),
      );
    }
    return SendCodeResult(
      devMode: json['dev'] == true,
      code: json['code']?.toString(),
    );
  }

  Future<LoginResult> verifyLogin(String email, String code) async {
    final json = await _client.post(
      '/api/auth/verify-login',
      body: {'email': email, 'code': code},
    );
    if (json['success'] != true || json['token'] is! String) {
      throw ApiException(
        statusCode: 400,
        message: (json['error'] ?? 'Login failed').toString(),
      );
    }
    return LoginResult(token: json['token'] as String);
  }

  Future<AuthMeResult> me() async {
    final json = await _client.get('/api/auth/me');
    final authenticated = json['authenticated'] == true;
    if (!authenticated) {
      return const AuthMeResult(authenticated: false, user: null);
    }
    final userJson = json['user'] as Map<String, dynamic>? ?? const {};
    return AuthMeResult(
      authenticated: true,
      user: AuthUser(
        id: userJson['id']?.toString() ?? '',
        email: userJson['email']?.toString(),
        displayName: userJson['displayName']?.toString(),
        useTampon: userJson['useTampon'] as bool?,
      ),
    );
  }
}

class SendCodeResult {
  const SendCodeResult({required this.devMode, required this.code});

  final bool devMode;
  final String? code;
}

class LoginResult {
  const LoginResult({required this.token});

  final String token;
}

class AuthMeResult {
  const AuthMeResult({required this.authenticated, required this.user});

  final bool authenticated;
  final AuthUser? user;
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.displayName,
    required this.useTampon,
  });

  final String id;
  final String? email;
  final String? displayName;
  final bool? useTampon;
}
