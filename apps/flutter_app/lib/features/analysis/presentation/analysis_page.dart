import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';

final analysisOverviewProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(analysisApiProvider).getOverview();
});

final analysisCyclesProvider = FutureProvider.autoDispose((ref) async {
  return ref.read(analysisApiProvider).getCycles(page: 1, pageSize: 10);
});

class AnalysisPage extends ConsumerWidget {
  const AnalysisPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final overview = ref.watch(analysisOverviewProvider);

    return FlowPage(
      title: l10n.analysisTitle,
      subtitle: l10n.analysisSubtitle,
      actions: [
        IconButton(
          onPressed: () {
            ref.invalidate(analysisOverviewProvider);
            ref.invalidate(analysisCyclesProvider);
          },
          icon: const Icon(Icons.refresh),
        ),
      ],
      children: [
        overview.when(
          data: (data) => Column(
            children: [
              _MetricCard(label: l10n.healthScore, value: '${data.healthScore}'),
              const SizedBox(height: 14),
              _MetricCard(label: l10n.cycleCount, value: '${data.cycleCount}'),
              const SizedBox(height: 14),
              _MetricCard(label: l10n.trend, value: data.trendStatus),
            ],
          ),
          loading: () => Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(child: Text(l10n.loading)),
            ),
          ),
          error: (error, stack) => Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.loadFailed),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => ref.invalidate(analysisOverviewProvider),
                    child: Text(l10n.retry),
                  ),
                ],
              ),
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
                Row(
                  children: [
                    Text('周期列表', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    OutlinedButton(
                      onPressed: () async {
                        final share = await ref.read(shareApiProvider).createOverview();
                        await Clipboard.setData(ClipboardData(text: share.path));
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已复制分享路径')));
                        }
                      },
                      child: const Text('分享'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Consumer(
                  builder: (context, ref, _) {
                    final cycles = ref.watch(analysisCyclesProvider);
                    return cycles.when(
                      data: (data) => Column(
                        children: [
                          for (final item in data.list)
                            ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text('${item.startDate} ~ ${item.endDate}'),
                              subtitle: Text('${item.daysCount}天 · ${item.totalVolumeMl.toStringAsFixed(0)}mL · ${item.levelStatus}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.go('/analysis/cycle/${item.cycleId}'),
                            ),
                        ],
                      ),
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Text('加载中...'),
                      ),
                      error: (error, stack) => const Text('周期列表加载失败'),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(child: Text(label, style: Theme.of(context).textTheme.titleLarge)),
            Text(value, style: Theme.of(context).textTheme.headlineMedium),
          ],
        ),
      ),
    );
  }
}
