String pad2(int value) => value.toString().padLeft(2, '0');

String ymdFromDate(DateTime date) {
  return '${date.year}-${pad2(date.month)}-${pad2(date.day)}';
}

DateTime parseYmd(String value) {
  final parts = value.split('-');
  if (parts.length != 3) return DateTime.now();
  return DateTime(
    int.tryParse(parts[0]) ?? DateTime.now().year,
    int.tryParse(parts[1]) ?? 1,
    int.tryParse(parts[2]) ?? 1,
  );
}

String todayYmd() => ymdFromDate(DateTime.now());

String addDaysYmd(String value, int days) {
  return ymdFromDate(parseYmd(value).add(Duration(days: days)));
}

String clampYmd(String value, String min, String max) {
  if (value.compareTo(min) < 0) return min;
  if (value.compareTo(max) > 0) return max;
  return value;
}
