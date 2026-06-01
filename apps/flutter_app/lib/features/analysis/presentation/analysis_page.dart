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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.copiedLink)),
      );
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return FlowPage(
      title: l10n.analysisTitle,
      subtitle: l10n.analysisSubtitleActive,
      actions: [
        AnimatedRotation(
          turns: _loading ? 1 : 0,
          duration: const Duration(milliseconds: 700),
          curve: Curves.easeOutCubic,
          child: IconButton(
            onPressed: () => _load(reset: true),
            icon: const Icon(Icons.refresh),
          ),
        ),
      ],
      children: [
        if (_overview == null && _loading) const _AnalysisLoadingState(),
        if (_overview != null)
          _AnimatedSection(
            delay: 0,
            child: _OverviewCard(
              overview: _overview!,
              sharing: _sharing,
              onShare: _shareOverview,
            ),
          ),
        if (_error != null) ...[
          const SizedBox(height: 16),
          _AnimatedSection(
            delay: 40,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(l10n.loadFailedWithError(_error!)),
              ),
            ),
          ),
        ],
        if (_overview?.risks.isNotEmpty == true) ...[
          const SizedBox(height: 16),
          _AnimatedSection(
            delay: 90,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.priorityRisks,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l10n.priorityRisks,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    for (final risk in _overview!.risks.take(5)) ...[
                      InkWell(
                        borderRadius: BorderRadius.circular(22),
                        onTap: () async {
                          await Clipboard.setData(
                            ClipboardData(text: risk.url),
                          );
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(l10n.riskLinkCopied)),
                          );
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 240),
                          curve: Curves.easeOutCubic,
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
                                    Text(
                                      _localizedAnalysisText(
                                        context,
                                        risk.triggerText,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Chip(
                                label: Text(
                                  _localizedAnalysisText(context, risk.level),
                                ),
                              ),
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
          ),
        ],
        const SizedBox(height: 16),
        _AnimatedSection(
          delay: 140,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.allCycles,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        l10n.cycles,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const Spacer(),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 240),
                        child: Text(
                          '${_cycles.length}/$_total',
                          key: ValueKey('${_cycles.length}/$_total'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_cycles.isEmpty && !_loading) Text(l10n.noCycles),
                  for (var index = 0; index < _cycles.length; index++)
                    _CycleListItem(item: _cycles[index], delay: index * 35),
                  if (_cycles.length < _total) ...[
                    const SizedBox(height: 12),
                    FilledButton.tonal(
                      onPressed: _loadingMore
                          ? null
                          : () => _load(reset: false),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        child: Text(
                          _loadingMore ? l10n.loading : l10n.moreCycles,
                          key: ValueKey(_loadingMore),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AnalysisLoadingState extends StatelessWidget {
  const _AnalysisLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        _LoadingCard(height: 228),
        SizedBox(height: 16),
        _LoadingCard(height: 198),
        SizedBox(height: 16),
        _LoadingCard(height: 320),
      ],
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).colorScheme.surface;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.92, end: 1),
      duration: const Duration(milliseconds: 1100),
      curve: Curves.easeInOut,
      builder: (context, value, child) =>
          Opacity(opacity: 0.72 + (value - 0.92), child: child),
      onEnd: () {},
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: base.withValues(alpha: 0.82),
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SkeletonBar(width: height * 0.32, height: 14),
            const SizedBox(height: 12),
            _SkeletonBar(width: height * 0.22, height: 34),
            const SizedBox(height: 20),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: const [
                _SkeletonPill(),
                _SkeletonPill(),
                _SkeletonPill(),
              ],
            ),
            const Spacer(),
            const _SkeletonBar(width: double.infinity, height: 16),
            const SizedBox(height: 10),
            const _SkeletonBar(width: 220, height: 16),
          ],
        ),
      ),
    );
  }
}

class _SkeletonBar extends StatelessWidget {
  const _SkeletonBar({required this.width, required this.height});

  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Theme.of(
          context,
        ).colorScheme.outlineVariant.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(999),
      ),
    );
  }
}

class _SkeletonPill extends StatelessWidget {
  const _SkeletonPill();

  @override
  Widget build(BuildContext context) {
    return const _SkeletonBar(width: 82, height: 34);
  }
}

class _AnimatedSection extends StatefulWidget {
  const _AnimatedSection({required this.child, this.delay = 0});

  final Widget child;
  final int delay;

  @override
  State<_AnimatedSection> createState() => _AnimatedSectionState();
}

class _AnimatedSectionState extends State<_AnimatedSection> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 80 + widget.delay), () {
      if (mounted) {
        setState(() => _visible = true);
      }
    });
  }

  @override
  void didUpdateWidget(covariant _AnimatedSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_visible) return;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      offset: _visible ? Offset.zero : const Offset(0, 0.04),
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      child: AnimatedOpacity(
        opacity: _visible ? 1 : 0,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

class _CycleListItem extends StatelessWidget {
  const _CycleListItem({required this.item, required this.delay});

  final AnalysisCycleItem item;
  final int delay;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return _AnimatedSection(
      delay: delay,
      child: InkWell(
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
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.daysAndVolume(
                        item.daysCount,
                        item.totalVolumeMl.toStringAsFixed(0),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _CycleTag(
                          text: _localizedAnalysisText(
                            context,
                            item.levelStatus,
                          ),
                          emphasis: item.levelStatus.contains('偏'),
                        ),
                        _CycleTag(
                          text:
                              '${l10n.distribution} · ${_localizedAnalysisText(context, item.distributionStatus)}',
                          emphasis: item.distributionStatus == '异常',
                        ),
                        _CycleTag(
                          text:
                              '${l10n.color} · ${_localizedAnalysisText(context, item.colorStatus)}',
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
    final l10n = AppLocalizations.of(context)!;
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
                l10n.healthScore,
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
                child: Text(sharing ? l10n.sharing : l10n.share),
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
                  l10n.scoreUnit,
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
                label: l10n.trend,
                value: _localizedAnalysisText(context, overview.trendStatus),
                inverse: true,
              ),
              _MetricPill(
                label: l10n.regularity,
                value: _localizedAnalysisText(
                  context,
                  overview.regularityStatus,
                ),
                inverse: true,
              ),
              _MetricPill(
                label: l10n.cycleCount,
                value: '${overview.cycleCount}',
                inverse: true,
              ),
            ],
          ),
          if (overview.timeline.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text(
              l10n.recentCycle,
              style: theme.textTheme.titleMedium?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: 10),
            for (final item in overview.timeline.take(4))
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  l10n.cycleTimelineItem(
                    item.startLabel,
                    item.menstrualDays,
                    item.totalVolumeMl.toStringAsFixed(0),
                    item.intervalDays == null
                        ? ''
                        : l10n.cycleInterval(item.intervalDays!),
                  ),
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

String _localizedAnalysisText(BuildContext context, String value) {
  if (Localizations.localeOf(context).languageCode != 'en') return value;
  return const {
        '异常': 'Flagged',
        '正常': 'Normal',
        '偏高': 'High',
        '较高': 'Elevated',
        '偏低': 'Low',
        '平稳': 'Stable',
        '规律': 'Regular',
        '不规律': 'Irregular',
        '经量偏多': 'Heavy flow',
        '经量偏少': 'Light flow',
        '分布异常': 'Distribution flagged',
        '颜色异常': 'Color flagged',
        '血块异常': 'Clots flagged',
      }[value] ??
      value;
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
