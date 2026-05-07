Map<String, dynamic>? asStringMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, entry) => MapEntry(key.toString(), entry));
  }
  return null;
}

Map<String, dynamic> asStringMapOrEmpty(dynamic value) {
  return Map<String, dynamic>.from(asStringMap(value) ?? const {});
}
