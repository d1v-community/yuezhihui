import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({required this.baseUrl, required this.tokenProvider});

  final String baseUrl;
  final Future<String?> Function() tokenProvider;

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? query}) {
    return _request('GET', path, query: query);
  }

  Future<Map<String, dynamic>> post(String path, {Object? body}) {
    return _request('POST', path, body: body);
  }

  Future<Map<String, dynamic>> put(String path, {Object? body}) {
    return _request('PUT', path, body: body);
  }

  Future<Map<String, dynamic>> patch(String path, {Object? body}) {
    return _request('PATCH', path, body: body);
  }

  Future<Map<String, dynamic>> delete(String path, {Object? body}) {
    return _request('DELETE', path, body: body);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
  }) async {
    final token = await tokenProvider();
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };

    late final http.Response response;
    final payload = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
      case 'POST':
        response = await http.post(uri, headers: headers, body: payload);
      case 'PUT':
        response = await http.put(uri, headers: headers, body: payload);
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: payload);
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers, body: payload);
        break;
      default:
        throw UnsupportedError('Unsupported method: $method');
    }

    final json = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _extractMessage(json) ?? 'Request failed',
      );
    }
    return json;
  }

  String? _extractMessage(Map<String, dynamic> json) {
    final message = json['message'] ?? json['error'];
    return message is String && message.isNotEmpty ? message : null;
  }
}

class ApiException implements Exception {
  ApiException({required this.statusCode, required this.message});

  final int statusCode;
  final String message;

  @override
  String toString() => 'ApiException($statusCode, $message)';
}
