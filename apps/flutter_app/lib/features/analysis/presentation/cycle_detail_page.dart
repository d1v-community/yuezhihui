import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';
import '../data/analysis_api.dart';

final cycleDetailProvider = FutureProvider.family<AnalysisCycleDetail, int>((
  ref,
  cycleId,
) async {
  return ref.read(analysisApiProvider).getCycleDetail(cycleId);
});

class CycleDetailPage extends ConsumerWidget {
  const CycleDetailPage({super.key, required this.cycleId});

  final int cycleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(cycleDetailProvider(cycleId));
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.cycleDetail),
        actions: [
          IconButton(
            onPressed: () async {
              final share = await ref
                  .read(shareApiProvider)
                  .createPeriod(cycleId);
              await Clipboard.setData(ClipboardData(text: share.path));
              if (!context.mounted) return;
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(l10n.cycleShareCopied)));
            },
            icon: const Icon(Icons.ios_share_outlined),
          ),
          IconButton(
            onPressed: () => ref.invalidate(cycleDetailProvider(cycleId)),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: detail.when(
        data: (data) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${data.cycle.startDate} ~ ${data.cycle.endDate}',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.daysAndVolume(
                        data.cycle.daysCount,
                        data.cycle.totalVolumeMl.toStringAsFixed(0),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final label in _focusHighlights(l10n, data))
                          Chip(label: Text(label)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(text: _buildCycleSummary(l10n, data)),
                        );
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(l10n.cycleSummaryCopied)),
                        );
                      },
                      icon: const Icon(Icons.content_copy_outlined),
                      label: Text(l10n.copyCycleSummary),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final item in [
                          (
                            l10n.level,
                            _localizedCycleText(
                              context,
                              data.cycle.levelStatus,
                            ),
                            data.cycle.levelLink,
                          ),
                          (
                            l10n.distribution,
                            _localizedCycleText(
                              context,
                              data.cycle.distributionStatus,
                            ),
                            data.cycle.distributionLink,
                          ),
                          (
                            l10n.color,
                            _localizedCycleText(
                              context,
                              data.cycle.colorStatus,
                            ),
                            data.cycle.colorLink,
                          ),
                          (
                            l10n.clot,
                            _localizedCycleText(context, data.cycle.clotStatus),
                            data.cycle.clotLink,
                          ),
                        ])
                          ActionChip(
                            label: Text('${item.$1}${item.$2}'),
                            onPressed: () async {
                              await Clipboard.setData(
                                ClipboardData(text: item.$3),
                              );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(l10n.explanationLinkCopied),
                                  ),
                                );
                              }
                            },
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.dailyDetails,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    if (data.days.isEmpty) Text(l10n.noBleedingDays),
                    for (final day in data.days)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('D${day.dayIndex} · ${day.date}'),
                        subtitle: Text(
                          l10n.dayDetails(
                            _localizedCycleText(
                              context,
                              day.dayColor ?? l10n.notRecorded,
                            ),
                            _localizedCycleText(context, day.clotLevel),
                            day.symptoms
                                .map(
                                  (item) => _localizedCycleText(context, item),
                                )
                                .join(', '),
                          ),
                        ),
                        trailing: Text(
                          '${day.totalVolumeMl.toStringAsFixed(0)}mL',
                        ),
                      ),
                  ],
                ),
              ),
            ),
            if (data.settlementTexts.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.productSettlement,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      for (final text in data.settlementTexts)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(_localizedCycleText(context, text)),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.cycleLoadFailed),
                    const SizedBox(height: 8),
                    Text(error.toString()),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () =>
                          ref.invalidate(cycleDetailProvider(cycleId)),
                      child: Text(l10n.retry),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<String> _focusHighlights(
    AppLocalizations l10n,
    AnalysisCycleDetail detail,
  ) {
    final tags = <String>[];
    if (detail.cycle.levelStatus.isNotEmpty) {
      tags.add(detail.cycle.levelStatus);
    }
    if (detail.cycle.distributionStatus == '异常') {
      tags.add(l10n.distributionAbnormal);
    }
    if (detail.cycle.colorStatus == '异常') {
      tags.add(l10n.colorAbnormal);
    }
    if (detail.cycle.clotStatus == '异常') {
      tags.add(l10n.clotAbnormal);
    }
    if (tags.isEmpty) {
      tags.add(l10n.trendStable);
    }
    return tags;
  }

  String _buildCycleSummary(AppLocalizations l10n, AnalysisCycleDetail detail) {
    final abnormal = _focusHighlights(l10n, detail).join(', ');
    return '${detail.cycle.startDate} ~ ${detail.cycle.endDate}'
        '\n${l10n.daysAndVolume(detail.cycle.daysCount, detail.cycle.totalVolumeMl.toStringAsFixed(0))}'
        '\n${l10n.summaryHighlights(abnormal)}';
  }
}

String _localizedCycleText(BuildContext context, String value) {
  if (Localizations.localeOf(context).languageCode != 'en') return value;
  return const {
        '异常': 'Flagged',
        '正常': 'Normal',
        '偏高': 'High',
        '较高': 'Elevated',
        '偏低': 'Low',
        '平稳': 'Stable',
        '未记录': 'Not recorded',
        '小血块': 'Small clot',
        '大血块': 'Large clot',
        '无': 'None',
        '粉': 'Pink',
        '红': 'Red',
        '锈红': 'Rust',
        '深红': 'Dark red',
        '棕': 'Brown',
      }[value] ??
      value;
}
