import 'package:shared_preferences/shared_preferences.dart';

import 'app_keys.dart';

class AppStorage {
  AppStorage(this._prefs);

  final SharedPreferences _prefs;

  static Future<AppStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    return AppStorage(prefs);
  }

  String? getAuthToken() => _prefs.getString(AppKeys.authToken);

  Future<void> setAuthToken(String token) async {
    await _prefs.setString(AppKeys.authToken, token);
  }

  Future<void> clearAuthToken() async {
    await _prefs.remove(AppKeys.authToken);
  }

  String? getLocaleCode() => _prefs.getString(AppKeys.locale);

  Future<void> setLocaleCode(String? localeCode) async {
    if (localeCode == null || localeCode.isEmpty) {
      await _prefs.remove(AppKeys.locale);
      return;
    }
    await _prefs.setString(AppKeys.locale, localeCode);
  }

  String? getString(String key) => _prefs.getString(key);

  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  Future<void> remove(String key) async {
    await _prefs.remove(key);
  }

  Future<void> setJson(String key, String json) async {
    await _prefs.setString(key, json);
  }
}
