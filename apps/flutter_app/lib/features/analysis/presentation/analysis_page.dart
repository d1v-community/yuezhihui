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
                  Text('风险提示', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  for (final risk in _overview!.risks.take(5)) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(risk.title),
                      subtitle: Text(risk.triggerText),
                      trailing: Chip(label: Text(risk.level)),
                      onTap: () async {
                        await Clipboard.setData(ClipboardData(text: risk.url));
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('已复制解释链接')),
                        );
                      },
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
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${item.startDate} ~ ${item.endDate}'),
                    subtitle: Text(
                      '${item.daysCount}天 · ${item.totalVolumeMl.toStringAsFixed(0)}mL · ${item.levelStatus} · 分布${item.distributionStatus}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/analysis/cycle/${item.cycleId}'),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  '分析 · ${overview.healthScore}分',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                OutlinedButton(
                  onPressed: sharing ? null : onShare,
                  child: Text(sharing ? '分享中...' : '分享'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _MetricPill(label: '趋势', value: overview.trendStatus),
                _MetricPill(label: '规律性', value: overview.regularityStatus),
                _MetricPill(label: '周期数', value: '${overview.cycleCount}'),
              ],
            ),
            if (overview.timeline.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('最近周期', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              for (final item in overview.timeline.take(4))
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    '${item.startLabel} · ${item.menstrualDays}天 · ${item.totalVolumeMl.toStringAsFixed(0)}mL'
                    '${item.intervalDays == null ? '' : ' · 间隔${item.intervalDays}天'}',
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MetricPill extends StatelessWidget {
  const _MetricPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.black54),
          ),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
