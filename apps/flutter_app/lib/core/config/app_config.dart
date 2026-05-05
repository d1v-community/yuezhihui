class AppConfig {
  static const defaultApiBaseUrl = 'https://www.yuezhihui.xyz';

  static String get apiBaseUrl {
    const value = String.fromEnvironment('API_BASE_URL', defaultValue: defaultApiBaseUrl);
    return value.endsWith('/') ? value.substring(0, value.length - 1) : value;
  }
}
