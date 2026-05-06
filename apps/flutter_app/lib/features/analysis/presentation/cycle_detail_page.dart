import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('周期详情'),
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
              ).showSnackBar(const SnackBar(content: Text('已复制周期分享路径')));
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
                      '${data.cycle.daysCount}天 · ${data.cycle.totalVolumeMl.toStringAsFixed(0)}mL',
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final label in _focusHighlights(data))
                          Chip(label: Text(label)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FilledButton.tonalIcon(
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(text: _buildCycleSummary(data)),
                        );
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('已复制周期摘要')),
                        );
                      },
                      icon: const Icon(Icons.content_copy_outlined),
                      label: const Text('复制周期摘要'),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final item in [
                          ('水平', data.cycle.levelStatus, data.cycle.levelLink),
                          (
                            '分布',
                            data.cycle.distributionStatus,
                            data.cycle.distributionLink,
                          ),
                          ('颜色', data.cycle.colorStatus, data.cycle.colorLink),
                          ('血块', data.cycle.clotStatus, data.cycle.clotLink),
                        ])
                          ActionChip(
                            label: Text('${item.$1}${item.$2}'),
                            onPressed: () async {
                              await Clipboard.setData(
                                ClipboardData(text: item.$3),
                              );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('已复制解释链接')),
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
                    Text('日明细', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    if (data.days.isEmpty) const Text('该周期暂无出血日数据。'),
                    for (final day in data.days)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('D${day.dayIndex} · ${day.date}'),
                        subtitle: Text(
                          '颜色 ${day.dayColor ?? '未记录'} · 血块 ${day.clotLevel} · 症状 ${day.symptoms.join('、')}',
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
                        '用品结算',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      for (final text in data.settlementTexts)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(text),
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
                    const Text('周期详情加载失败'),
                    const SizedBox(height: 8),
                    Text(error.toString()),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () =>
                          ref.invalidate(cycleDetailProvider(cycleId)),
                      child: const Text('重试'),
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

  List<String> _focusHighlights(AnalysisCycleDetail detail) {
    final tags = <String>[];
    if (detail.cycle.levelStatus.isNotEmpty) {
      tags.add(detail.cycle.levelStatus);
    }
    if (detail.cycle.distributionStatus == '异常') {
      tags.add('分布异常');
    }
    if (detail.cycle.colorStatus == '异常') {
      tags.add('颜色异常');
    }
    if (detail.cycle.clotStatus == '异常') {
      tags.add('血块异常');
    }
    if (tags.isEmpty) {
      tags.add('整体趋势平稳');
    }
    return tags;
  }

  String _buildCycleSummary(AnalysisCycleDetail detail) {
    final abnormal = _focusHighlights(detail).join('、');
    return '${detail.cycle.startDate} ~ ${detail.cycle.endDate}'
        '\n${detail.cycle.daysCount}天 · ${detail.cycle.totalVolumeMl.toStringAsFixed(0)}mL'
        '\n重点：$abnormal';
  }
}
