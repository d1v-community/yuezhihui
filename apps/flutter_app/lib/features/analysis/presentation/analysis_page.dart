import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';
import '../data/analysis_api.dart';

class AnalysisPage extends ConsumerStatefulWidget {
  const AnalysisPage({super.key});

  @override
  ConsumerState<AnalysisPage> createState() => _AnalysisPageState();
}

class _AnalysisPageState extends ConsumerState<AnalysisPage> {
  AnalysisOverview? _overview;
  final List<AnalysisCycleItem> _cycles = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _sharing = false;
  String? _error;
  int _page = 1;
  int _total = 0;
  static const _pageSize = 10;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => _load(reset: true));
  }

  Future<void> _load({required bool reset}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final nextPage = reset ? 1 : _page + 1;
      final overview = reset
          ? await ref.read(analysisApiProvider).getOverview()
          : _overview;
      final cycles = await ref
          .read(analysisApiProvider)
          .getCycles(page: nextPage, pageSize: _pageSize);
      if (!mounted) return;
      setState(() {
        _overview = overview ?? _overview;
        _page = cycles.page;
        _total = cycles.total;
        if (reset) {
          _cycles
            ..clear()
            ..addAll(cycles.list);
        } else {
          _cycles.addAll(cycles.list);
        }
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  Future<void> _shareOverview() async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      final share = await ref.read(shareApiProvider).createOverview();
      await Clipboard.setData(ClipboardData(text: share.path));
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('已复制分享路径')));
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FlowPage(
      title: l10n.analysisTitle,
      subtitle: '风险提示、周期列表与分享能力。',
      actions: [
        IconButton(
          onPressed: () => _load(reset: true),
          icon: const Icon(Icons.refresh),
        ),
      ],
      children: [
        if (_overview == null && _loading)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
        if (_overview != null)
          _OverviewCard(
            overview: _overview!,
            sharing: _sharing,
            onShare: _shareOverview,
          ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Text('分析加载失败：$_error'),
            ),
          ),
        ],
        if (_overview?.risks.isNotEmpty == true) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '优先关注',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text('风险提示', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  for (final risk in _overview!.risks.take(5)) ...[
                    InkWell(
                      borderRadius: BorderRadius.circular(22),
                      onTap: () async {
                        await Clipboard.setData(ClipboardData(text: risk.url));
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('已复制解释链接')),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: risk.level.contains('较高')
                              ? const Color(0xFFF8E4E0)
                              : const Color(0xFFF5ECE3),
                          borderRadius: BorderRadius.circular(22),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              margin: const EdgeInsets.only(top: 6),
                              decoration: BoxDecoration(
                                color: risk.level.contains('较高')
                                    ? const Color(0xFFC05A4A)
                                    : const Color(0xFFAA7A4C),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    risk.title,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(risk.triggerText),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Chip(label: Text(risk.level)),
                          ],
                        ),
                      ),
                    ),
                    const Divider(height: 12),
                  ],
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '全部周期',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text('周期列表', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    Text('${_cycles.length}/$_total'),
                  ],
                ),
                const SizedBox(height: 12),
                if (_cycles.isEmpty && !_loading) const Text('暂无可分析的周期。'),
                for (final item in _cycles)
                  InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => context.go('/analysis/cycle/${item.cycleId}'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.72),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 6,
                            height: 54,
                            decoration: BoxDecoration(
                              color: item.levelStatus.contains('偏')
                                  ? const Color(0xFFC06B57)
                                  : const Color(0xFF7A4C56),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${item.startDate} ~ ${item.endDate}',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '${item.daysCount}天 · ${item.totalVolumeMl.toStringAsFixed(0)}mL',
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    _CycleTag(
                                      text: item.levelStatus,
                                      emphasis: item.levelStatus.contains('偏'),
                                    ),
                                    _CycleTag(
                                      text: '分布${item.distributionStatus}',
                                      emphasis: item.distributionStatus == '异常',
                                    ),
                                    _CycleTag(
                                      text: '颜色${item.colorStatus}',
                                      emphasis: item.colorStatus == '异常',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(Icons.chevron_right),
                        ],
                      ),
                    ),
                  ),
                if (_cycles.length < _total) ...[
                  const SizedBox(height: 12),
                  FilledButton.tonal(
                    onPressed: _loadingMore ? null : () => _load(reset: false),
                    child: Text(_loadingMore ? '加载中...' : '加载更多'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({
    required this.overview,
    required this.sharing,
    required this.onShare,
  });

  final AnalysisOverview overview;
  final bool sharing;
  final Future<void> Function() onShare;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF402A31), Color(0xFF7A4350), Color(0xFFAA6A67)],
        ),
        borderRadius: BorderRadius.circular(34),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.18),
            blurRadius: 34,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Health Score',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.72),
                  letterSpacing: 0.6,
                ),
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: sharing ? null : onShare,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                ),
                child: Text(sharing ? '分享中...' : '分享'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${overview.healthScore}',
                style: theme.textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontSize: 56,
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  '分',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _MetricPill(
                label: '趋势',
                value: overview.trendStatus,
                inverse: true,
              ),
              _MetricPill(
                label: '规律性',
                value: overview.regularityStatus,
                inverse: true,
              ),
              _MetricPill(
                label: '周期数',
                value: '${overview.cycleCount}',
                inverse: true,
              ),
            ],
          ),
          if (overview.timeline.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              '最近周期',
              style: theme.textTheme.titleMedium?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 10),
            for (final item in overview.timeline.take(4))
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  '${item.startLabel} · ${item.menstrualDays}天 · ${item.totalVolumeMl.toStringAsFixed(0)}mL'
                  '${item.intervalDays == null ? '' : ' · 间隔${item.intervalDays}天'}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.82),
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({
    required this.label,
    required this.value,
    this.inverse = false,
  });

  final String label;
  final String value;
  final bool inverse;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: inverse
            ? Colors.white.withValues(alpha: 0.12)
            : Colors.white.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: inverse
                  ? Colors.white.withValues(alpha: 0.72)
                  : Colors.black54,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: inverse ? Colors.white : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _CycleTag extends StatelessWidget {
  const _CycleTag({required this.text, required this.emphasis});

  final String text;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: emphasis ? const Color(0xFFF2DDD5) : const Color(0xFFF4EFEB),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: emphasis ? const Color(0xFF9A533F) : const Color(0xFF5F4F4A),
        ),
      ),
    );
  }
}
