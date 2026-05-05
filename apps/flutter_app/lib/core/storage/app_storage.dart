import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'app_keys.dart';

class AppStorage {
  AppStorage(this._prefs);

  final SharedPreferences _prefs;
  final Map<String, Object?> _valueCache = {};
  final Map<String, Map<String, dynamic>?> _jsonMapCache = {};

  static Future<AppStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    return AppStorage(prefs);
  }

  String? getAuthToken() => getString(AppKeys.authToken);

  Future<void> setAuthToken(String token) async {
    await setString(AppKeys.authToken, token);
  }

  Future<void> clearAuthToken() async {
    await remove(AppKeys.authToken);
  }

  String? getLocaleCode() => getString(AppKeys.locale);

  Future<void> setLocaleCode(String? localeCode) async {
    if (localeCode == null || localeCode.isEmpty) {
      await remove(AppKeys.locale);
      return;
    }
    await setString(AppKeys.locale, localeCode);
  }

  String? getString(String key) {
    if (_valueCache.containsKey(key)) {
      return _valueCache[key] as String?;
    }
    final value = _prefs.getString(key);
    _valueCache[key] = value;
    return value;
  }

  Future<void> setString(String key, String value) async {
    _valueCache[key] = value;
    _jsonMapCache.remove(key);
    await _prefs.setString(key, value);
  }

  bool? getBool(String key) {
    if (_valueCache.containsKey(key)) {
      return _valueCache[key] as bool?;
    }
    final value = _prefs.getBool(key);
    _valueCache[key] = value;
    return value;
  }

  Future<void> setBool(String key, bool value) async {
    _valueCache[key] = value;
    await _prefs.setBool(key, value);
  }

  Future<void> remove(String key) async {
    _valueCache.remove(key);
    _jsonMapCache.remove(key);
    await _prefs.remove(key);
  }

  Future<void> setJson(String key, String json) async {
    _valueCache[key] = json;
    _jsonMapCache.remove(key);
    await _prefs.setString(key, json);
  }

  Map<String, dynamic>? getJsonMap(String key) {
    if (_jsonMapCache.containsKey(key)) {
      final cached = _jsonMapCache[key];
      return cached == null ? null : Map<String, dynamic>.from(cached);
    }
    final raw = getString(key);
    if (raw == null || raw.isEmpty) {
      _jsonMapCache[key] = null;
      return null;
    }
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      _jsonMapCache[key] = null;
      return null;
    }
    _jsonMapCache[key] = decoded;
    return Map<String, dynamic>.from(decoded);
  }

  Future<void> setJsonMap(String key, Map<String, dynamic>? value) async {
    if (value == null) {
      await remove(key);
      return;
    }
    final copy = Map<String, dynamic>.from(value);
    _jsonMapCache[key] = copy;
    final raw = jsonEncode(copy);
    _valueCache[key] = raw;
    await _prefs.setString(key, raw);
  }
}
