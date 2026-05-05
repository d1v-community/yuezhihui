import '../../../core/network/api_client.dart';

class MenstrualApi {
  MenstrualApi(this._client);

  final ApiClient _client;

  Future<List<MenstrualDailySummary>> getDailyRange(String start, String end) async {
    final json = await _client.get('/api/menstrual/daily', query: {
      'start': start,
      'end': end,
    });
    final data = (json['data'] as List<dynamic>? ?? const []);
    return data.map((item) => MenstrualDailySummary.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<MenstrualDailyDetail> getDailyByDate(String date) async {
    final json = await _client.get('/api/menstrual/daily/$date');
    return MenstrualDailyDetail.fromJson(json['data'] as Map<String, dynamic>? ?? const {});
  }

  Future<void> putDailyByDate(String date, MenstrualDailyInput input) async {
    await _client.put('/api/menstrual/daily/$date', body: input.toJson());
  }
}

class MenstrualDailySummary {
  MenstrualDailySummary({
    required this.date,
    required this.hasBleeding,
    required this.totalVolumeMl,
    required this.dayColor,
  });

  final String date;
  final bool hasBleeding;
  final double totalVolumeMl;
  final String? dayColor;

  factory MenstrualDailySummary.fromJson(Map<String, dynamic> json) {
    return MenstrualDailySummary(
      date: json['date']?.toString() ?? '',
      hasBleeding: json['hasBleeding'] == true,
      totalVolumeMl: (json['totalVolumeMl'] as num?)?.toDouble() ?? 0,
      dayColor: json['dayColor']?.toString(),
    );
  }
}

class MenstrualEventInput {
  MenstrualEventInput({
    required this.eventTime,
    required this.eventType,
    this.productType,
    this.model,
    this.color,
    this.volumeMl,
    this.symptomName,
  });

  final String eventTime;
  final String eventType;
  final String? productType;
  final String? model;
  final String? color;
  final double? volumeMl;
  final String? symptomName;

  Map<String, dynamic> toJson() {
    return {
      'eventTime': eventTime,
      'eventType': eventType,
      if (productType != null) 'productType': productType,
      if (model != null) 'model': model,
      if (color != null) 'color': color,
      if (volumeMl != null) 'volumeMl': volumeMl,
      if (symptomName != null) 'symptomName': symptomName,
    };
  }
}

class MenstrualDailyInput {
  MenstrualDailyInput({
    required this.hasBleeding,
    required this.events,
  });

  final bool hasBleeding;
  final List<MenstrualEventInput> events;

  Map<String, dynamic> toJson() {
    return {
      'hasBleeding': hasBleeding,
      'events': events.map((e) => e.toJson()).toList(),
    };
  }
}

class MenstrualDailyDetail {
  MenstrualDailyDetail({
    required this.date,
    required this.hasBleeding,
    required this.totalVolumeMl,
    required this.dayColor,
    required this.clotSmall,
    required this.clotLarge,
    required this.events,
  });

  final String date;
  final bool hasBleeding;
  final double totalVolumeMl;
  final String? dayColor;
  final int clotSmall;
  final int clotLarge;
  final List<MenstrualEventDetail> events;

  factory MenstrualDailyDetail.fromJson(Map<String, dynamic> json) {
    final clotCounts = json['clotCounts'] as Map<String, dynamic>? ?? const {};
    final events = (json['events'] as List<dynamic>? ?? const [])
        .map((item) => MenstrualEventDetail.fromJson(item as Map<String, dynamic>))
        .toList();
    return MenstrualDailyDetail(
      date: json['date']?.toString() ?? '',
      hasBleeding: json['hasBleeding'] == true,
      totalVolumeMl: (json['totalVolumeMl'] as num?)?.toDouble() ?? 0,
      dayColor: json['dayColor']?.toString(),
      clotSmall: (clotCounts['small'] as num?)?.toInt() ?? 0,
      clotLarge: (clotCounts['large'] as num?)?.toInt() ?? 0,
      events: events,
    );
  }
}

class MenstrualEventDetail {
  MenstrualEventDetail({
    required this.id,
    required this.eventTime,
    required this.eventType,
    this.productType,
    this.model,
    this.color,
    this.volumeMl,
    this.symptomName,
  });

  final int id;
  final String eventTime;
  final String eventType;
  final String? productType;
  final String? model;
  final String? color;
  final double? volumeMl;
  final String? symptomName;

  factory MenstrualEventDetail.fromJson(Map<String, dynamic> json) {
    return MenstrualEventDetail(
      id: (json['id'] as num?)?.toInt() ?? 0,
      eventTime: json['eventTime']?.toString() ?? '',
      eventType: json['eventType']?.toString() ?? '',
      productType: json['productType']?.toString(),
      model: json['model']?.toString(),
      color: json['color']?.toString(),
      volumeMl: (json['volumeMl'] as num?)?.toDouble(),
      symptomName: json['symptomName']?.toString(),
    );
  }
}
