import '../../../core/network/api_client.dart';

class AnalysisApi {
  AnalysisApi(this._client);

  final ApiClient _client;

  Future<AnalysisOverview> getOverview({int limit = 6}) async {
    final json = await _client.get('/api/analysis/overview', query: {
      'limit': '$limit',
    });
    final data = json['data'] as Map<String, dynamic>? ?? const {};
    final trend = data['trend'] as Map<String, dynamic>? ?? const {};
    return AnalysisOverview(
      cycleCount: (data['cycleCount'] as num?)?.toInt() ?? 0,
      healthScore: (data['healthScore'] as num?)?.toInt() ?? 0,
      trendStatus: trend['status']?.toString() ?? '',
    );
  }

  Future<AnalysisCycleList> getCycles({int page = 1, int pageSize = 10}) async {
    final json = await _client.get('/api/analysis/cycles', query: {
      'page': '$page',
      'pageSize': '$pageSize',
    });
    final data = json['data'] as Map<String, dynamic>? ?? const {};
    final list = (data['list'] as List<dynamic>? ?? const [])
        .map((item) => AnalysisCycleItem.fromJson(item as Map<String, dynamic>))
        .toList();
    return AnalysisCycleList(
      page: (data['page'] as num?)?.toInt() ?? 1,
      pageSize: (data['pageSize'] as num?)?.toInt() ?? pageSize,
      total: (data['total'] as num?)?.toInt() ?? 0,
      list: list,
    );
  }

  Future<AnalysisCycleDetail> getCycleDetail(int cycleId) async {
    final json = await _client.get('/api/analysis/cycles/$cycleId');
    final data = json['data'] as Map<String, dynamic>? ?? const {};
    final cycle = data['cycle'] as Map<String, dynamic>? ?? const {};
    final days = (data['days'] as List<dynamic>? ?? const [])
        .map((item) => AnalysisCycleDay.fromJson(item as Map<String, dynamic>))
        .toList();
    final products = data['products'] as Map<String, dynamic>? ?? const {};
    final settlement = products['settlement'] as Map<String, dynamic>? ?? const {};
    final stats = (settlement['stats'] as List<dynamic>? ?? const [])
        .map((item) => (item as Map<String, dynamic>)['text']?.toString() ?? '')
        .where((text) => text.isNotEmpty)
        .toList();
    return AnalysisCycleDetail(
      cycle: AnalysisCycleItem.fromJson(cycle),
      days: days,
      settlementTexts: stats,
    );
  }
}

class AnalysisOverview {
  const AnalysisOverview({
    required this.cycleCount,
    required this.healthScore,
    required this.trendStatus,
  });

  final int cycleCount;
  final int healthScore;
  final String trendStatus;
}

class AnalysisCycleList {
  AnalysisCycleList({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.list,
  });

  final int page;
  final int pageSize;
  final int total;
  final List<AnalysisCycleItem> list;
}

class AnalysisCycleItem {
  AnalysisCycleItem({
    required this.cycleId,
    required this.startDate,
    required this.endDate,
    required this.daysCount,
    required this.totalVolumeMl,
    required this.levelStatus,
    required this.levelLink,
    required this.distributionStatus,
    required this.distributionLink,
    required this.colorStatus,
    required this.colorLink,
    required this.clotStatus,
    required this.clotLink,
  });

  final int cycleId;
  final String startDate;
  final String endDate;
  final int daysCount;
  final double totalVolumeMl;
  final String levelStatus;
  final String levelLink;
  final String distributionStatus;
  final String distributionLink;
  final String colorStatus;
  final String colorLink;
  final String clotStatus;
  final String clotLink;

  factory AnalysisCycleItem.fromJson(Map<String, dynamic> json) {
    final level = json['level'] as Map<String, dynamic>? ?? const {};
    final distribution = json['distribution'] as Map<String, dynamic>? ?? const {};
    final color = json['color'] as Map<String, dynamic>? ?? const {};
    final clot = json['clot'] as Map<String, dynamic>? ?? const {};
    return AnalysisCycleItem(
      cycleId: (json['cycleId'] as num?)?.toInt() ?? 0,
      startDate: json['startDate']?.toString() ?? '',
      endDate: json['endDate']?.toString() ?? '',
      daysCount: (json['daysCount'] as num?)?.toInt() ?? 0,
      totalVolumeMl: (json['totalVolumeMl'] as num?)?.toDouble() ?? 0,
      levelStatus: level['status']?.toString() ?? '',
      levelLink: level['link']?.toString() ?? '',
      distributionStatus: distribution['status']?.toString() ?? '',
      distributionLink: distribution['link']?.toString() ?? '',
      colorStatus: color['status']?.toString() ?? '',
      colorLink: color['link']?.toString() ?? '',
      clotStatus: clot['status']?.toString() ?? '',
      clotLink: clot['link']?.toString() ?? '',
    );
  }
}

class AnalysisCycleDetail {
  AnalysisCycleDetail({
    required this.cycle,
    required this.days,
    required this.settlementTexts,
  });

  final AnalysisCycleItem cycle;
  final List<AnalysisCycleDay> days;
  final List<String> settlementTexts;
}

class AnalysisCycleDay {
  AnalysisCycleDay({
    required this.dayIndex,
    required this.date,
    required this.totalVolumeMl,
    required this.dayColor,
    required this.clotLevel,
    required this.symptoms,
    required this.productsCount,
  });

  final int dayIndex;
  final String date;
  final double totalVolumeMl;
  final String? dayColor;
  final String clotLevel;
  final List<String> symptoms;
  final int productsCount;

  factory AnalysisCycleDay.fromJson(Map<String, dynamic> json) {
    final products = (json['products'] as List<dynamic>? ?? const []);
    final symptoms = (json['symptoms'] as List<dynamic>? ?? const []).map((e) => e.toString()).toList();
    return AnalysisCycleDay(
      dayIndex: (json['dayIndex'] as num?)?.toInt() ?? 0,
      date: json['date']?.toString() ?? '',
      totalVolumeMl: (json['totalVolumeMl'] as num?)?.toDouble() ?? 0,
      dayColor: json['dayColor']?.toString(),
      clotLevel: json['clotLevel']?.toString() ?? '',
      symptoms: symptoms,
      productsCount: products.length,
    );
  }
}
