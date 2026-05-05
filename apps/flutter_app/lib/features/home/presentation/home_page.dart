import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/date_utils.dart';
import '../../../core/session/session_controller.dart';
import '../../menstrual/data/menstrual_api.dart';
import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';

final dailyRangeProvider = FutureProvider.family<List<MenstrualDailySummary>, ({String start, String end})>((ref, params) async {
  return ref.read(menstrualApiProvider).getDailyRange(params.start, params.end);
});

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  late String _selectedDate = todayYmd();
  final List<_LocalEvent> _events = [];
  String _dayColor = 'red';
  String _padType = 'day';
  String _tamponModel = 'regular';
  double _padVolume = 5;
  double _tamponVolume = 5;
  bool _loadingDetail = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadSelectedDate);
  }

  Future<void> _pickDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: parseYmd(_selectedDate),
      firstDate: DateTime.now().subtract(const Duration(days: 180)),
      lastDate: DateTime.now(),
    );
    if (selected == null) return;
    setState(() => _selectedDate = ymdFromDate(selected));
    await _loadSelectedDate();
  }

  Future<void> _loadSelectedDate() async {
    setState(() => _loadingDetail = true);
    try {
      final detail = await ref.read(menstrualApiProvider).getDailyByDate(_selectedDate);
      _events
        ..clear()
        ..addAll(
          detail.events.map(
            (event) => _LocalEvent(
              id: '${event.id}',
              eventType: event.eventType,
              eventTime: event.eventTime,
              productType: event.productType,
              model: event.model,
              color: event.color ?? detail.dayColor ?? 'red',
              volumeMl: event.volumeMl ?? 0,
              symptomName: event.symptomName,
            ),
          ),
        );
      setState(() {
        _dayColor = detail.dayColor ?? 'red';
      });
    } finally {
      if (mounted) setState(() => _loadingDetail = false);
    }
  }

  void _addPad() {
    setState(() {
      _events.add(
        _LocalEvent(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          eventType: 'pad',
          eventTime: DateTime.now().toIso8601String(),
          productType: _padType,
          model: null,
          color: _dayColor,
          volumeMl: _padVolume,
          symptomName: null,
        ),
      );
    });
  }

  void _addTampon() {
    setState(() {
      _events.add(
        _LocalEvent(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          eventType: 'tampon',
          eventTime: DateTime.now().toIso8601String(),
          productType: null,
          model: _tamponModel,
          color: _dayColor,
          volumeMl: _tamponVolume,
          symptomName: null,
        ),
      );
    });
  }

  void _addSymptom(String symptom) {
    setState(() {
      _events.add(
        _LocalEvent(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          eventType: 'symptom',
          eventTime: DateTime.now().toIso8601String(),
          productType: null,
          model: null,
          color: _dayColor,
          volumeMl: symptom == '大血块' ? 4 : 2,
          symptomName: symptom,
        ),
      );
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(menstrualApiProvider).putDailyByDate(
            _selectedDate,
            MenstrualDailyInput(
              hasBleeding: _events.isNotEmpty,
              events: _events
                  .map(
                    (event) => MenstrualEventInput(
                      eventTime: event.eventTime,
                      eventType: event.eventType,
                      productType: event.productType,
                      model: event.model,
                      color: event.color,
                      volumeMl: event.volumeMl,
                      symptomName: event.symptomName,
                    ),
                  )
                  .toList(),
            ),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已保存')));
      ref.invalidate(dailyRangeProvider);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref.watch(sessionControllerProvider);
    final user = session.user;
    final today = todayYmd();
    final range = ref.watch(
      dailyRangeProvider((
        start: addDaysYmd(today, -14),
        end: today,
      )),
    );
    final totalMl = _events.fold<double>(0, (sum, event) => sum + (event.volumeMl ?? 0));

    return FlowPage(
      title: l10n.homeTitle,
      subtitle: l10n.homeSubtitle,
      children: [
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.todaySummary, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text('${l10n.signedInAs}: ${user?.email ?? l10n.unknown}'),
                  const Spacer(),
                  OutlinedButton(onPressed: _pickDate, child: Text(_selectedDate)),
                ],
              ),
              const SizedBox(height: 8),
              Text('${user?.useTampon == true ? l10n.useTampon : l10n.unknown} · ${totalMl.toStringAsFixed(1)}mL'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('最近 14 天', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              range.when(
                data: (items) => Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final item in items)
                      ChoiceChip(
                        label: Text('${item.date.substring(5)} ${item.totalVolumeMl.toStringAsFixed(0)}mL'),
                        selected: item.date == _selectedDate,
                        onSelected: (_) async {
                          setState(() => _selectedDate = item.date);
                          await _loadSelectedDate();
                        },
                      ),
                  ],
                ),
                loading: () => const Text('加载中...'),
                error: (error, stack) => const Text('日历加载失败'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('新增用品事件', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: [
                  for (final color in const ['pink', 'red', 'rust', 'dark', 'brown'])
                    ChoiceChip(
                      label: Text(color),
                      selected: _dayColor == color,
                      onSelected: (_) => setState(() => _dayColor = color),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _padType,
                items: const [
                  DropdownMenuItem(value: 'liner', child: Text('护垫')),
                  DropdownMenuItem(value: 'day', child: Text('日用')),
                  DropdownMenuItem(value: 'night', child: Text('夜用')),
                  DropdownMenuItem(value: 'pants', child: Text('安睡裤')),
                ],
                onChanged: (value) => setState(() => _padType = value ?? 'day'),
                decoration: const InputDecoration(labelText: '卫生巾类型'),
              ),
              Slider(
                value: _padVolume,
                min: 1,
                max: 20,
                divisions: 19,
                label: '${_padVolume.toStringAsFixed(0)}mL',
                onChanged: (value) => setState(() => _padVolume = value),
              ),
              FilledButton.tonal(onPressed: _addPad, child: const Text('添加卫生巾事件')),
              const SizedBox(height: 12),
              if (user?.useTampon == true) ...[
                DropdownButtonFormField<String>(
                  initialValue: _tamponModel,
                  items: const [
                    DropdownMenuItem(value: 'mini', child: Text('迷你')),
                    DropdownMenuItem(value: 'regular', child: Text('常规')),
                    DropdownMenuItem(value: 'large', child: Text('大号')),
                    DropdownMenuItem(value: 'super', child: Text('超大')),
                  ],
                  onChanged: (value) => setState(() => _tamponModel = value ?? 'regular'),
                  decoration: const InputDecoration(labelText: '棉条型号'),
                ),
                Slider(
                  value: _tamponVolume,
                  min: 1,
                  max: 20,
                  divisions: 19,
                  label: '${_tamponVolume.toStringAsFixed(0)}mL',
                  onChanged: (value) => setState(() => _tamponVolume = value),
                ),
                FilledButton.tonal(onPressed: _addTampon, child: const Text('添加棉条事件')),
                const SizedBox(height: 12),
              ],
              Wrap(
                spacing: 8,
                children: [
                  OutlinedButton(onPressed: () => _addSymptom('小血块'), child: const Text('＋小血块')),
                  OutlinedButton(onPressed: () => _addSymptom('大血块'), child: const Text('＋大血块')),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('当日事件', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              if (_loadingDetail) const Text('加载中...'),
              if (!_loadingDetail && _events.isEmpty) const Text('今天还没有记录。'),
              for (final event in _events)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(_formatEvent(event)),
                  subtitle: Text(event.eventTime.substring(11, 16)),
                  trailing: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() => _events.removeWhere((item) => item.id == event.id)),
                  ),
                ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? '保存中...' : '保存记录')),
                  OutlinedButton(
                    onPressed: () => context.go('/analysis'),
                    child: Text(l10n.viewAnalysis),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatEvent(_LocalEvent event) {
    if (event.eventType == 'symptom') return '症状 · ${event.symptomName}';
    if (event.eventType == 'pad') return '卫生巾 · ${event.productType} · ${event.volumeMl?.toStringAsFixed(0)}mL';
    return '棉条 · ${event.model} · ${event.volumeMl?.toStringAsFixed(0)}mL';
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: child,
      ),
    );
  }
}

class _LocalEvent {
  _LocalEvent({
    required this.id,
    required this.eventType,
    required this.eventTime,
    required this.productType,
    required this.model,
    required this.color,
    required this.volumeMl,
    required this.symptomName,
  });

  final String id;
  final String eventType;
  final String eventTime;
  final String? productType;
  final String? model;
  final String? color;
  final double? volumeMl;
  final String? symptomName;
}
