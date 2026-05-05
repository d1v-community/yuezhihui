import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';
import '../../../core/utils/date_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../menstrual/data/menstrual_api.dart';
import '../../shared/presentation/flow_page.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  static const _stripDays = 14;
  static const _quickVolumes = [1.0, 3.0, 5.0, 8.0, 12.0];
  static const _colors = ['pink', 'red', 'rust', 'dark', 'brown'];

  String _selectedDate = todayYmd();
  String _stripStart = addDaysYmd(todayYmd(), -13);
  bool _loadingPage = true;
  bool _loadingDetail = false;
  bool _saving = false;

  bool _showPad = true;
  bool _showBleeding = true;
  bool _useTampon = true;
  String _padInputMode = 'click';
  String _tamponInputMode = 'click';

  String _dayColor = 'red';
  String _padType = 'day';
  String _tamponModel = 'regular';
  double _padVolume = 5;
  double _tamponVolume = 5;

  final List<_LocalEvent> _events = [];
  final List<String> _padUndoStack = [];
  final List<String> _tamponUndoStack = [];
  final Map<String, MenstrualDailySummary> _rangeMap = {};
  String _snapshot = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(_bootstrap);
  }

  Future<void> _bootstrap() async {
    final session = ref.read(sessionControllerProvider);
    final storage = await ref.read(appStorageProvider.future);
    final visibility = _readJsonMap(
      storage.getString(AppKeys.visibilitySettings),
    );
    final inputMode = _readJsonMap(
      storage.getString(AppKeys.inputModeSettings),
    );
    final today = todayYmd();
    final minDate = addDaysYmd(today, -180);
    final anchor = clampYmd(
      storage.getString(AppKeys.onboardingAnchorDate) ?? today,
      minDate,
      today,
    );
    final firstCompleted = storage.getString(AppKeys.dailyFirstCompletedAt);
    final initial = firstCompleted == null || firstCompleted.isEmpty
        ? anchor
        : today;

    setState(() {
      _showPad = visibility['sanitaryPad'] is bool
          ? visibility['sanitaryPad'] as bool
          : true;
      _showBleeding = visibility['bleeding'] is bool
          ? visibility['bleeding'] as bool
          : true;
      _padInputMode = inputMode['sanitaryPad'] == 'drag' ? 'drag' : 'click';
      _tamponInputMode = inputMode['tampon'] == 'drag' ? 'drag' : 'click';
      _useTampon = session.user?.useTampon ?? true;
      _selectedDate = initial;
      _stripStart = _reanchorStrip(initial);
    });

    await _loadRange();
    await _loadDate(initial);

    if ((firstCompleted == null || firstCompleted.isEmpty) &&
        storage.getString(AppKeys.dailyFirstGuideShown) != '1') {
      await storage.setString(AppKeys.dailyFirstGuideShown, '1');
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('已定位到最近一次月经开始日，建议先补全这一天。')));
    }

    if (mounted) {
      setState(() => _loadingPage = false);
    }
  }

  Map<String, dynamic> _readJsonMap(String? raw) {
    if (raw == null || raw.isEmpty) return const {};
    final decoded = jsonDecode(raw);
    return decoded is Map<String, dynamic> ? decoded : const {};
  }

  Future<void> _loadRange() async {
    final end = addDaysYmd(_stripStart, _stripDays - 1);
    final items = await ref
        .read(menstrualApiProvider)
        .getDailyRange(_stripStart, end);
    if (!mounted) return;
    setState(() {
      _rangeMap
        ..clear()
        ..addEntries(items.map((item) => MapEntry(item.date, item)));
    });
  }

  Future<void> _loadDate(String date) async {
    setState(() => _loadingDetail = true);
    try {
      final detail = await ref.read(menstrualApiProvider).getDailyByDate(date);
      final storage = await ref.read(appStorageProvider.future);
      final draft = _readDraft(
        storage.getString('${AppKeys.dailyDraftPrefix}$date'),
      );
      final local = draft ?? _DailyDraft.fromDetail(detail);
      _events
        ..clear()
        ..addAll(local.events);
      _padUndoStack.clear();
      _tamponUndoStack.clear();
      _snapshot = jsonEncode(local.toJson());
      if (!mounted) return;
      setState(() {
        _selectedDate = date;
        _dayColor = local.dayColor;
        _padVolume = 5;
        _tamponVolume = 5;
      });
    } finally {
      if (mounted) setState(() => _loadingDetail = false);
    }
  }

  _DailyDraft? _readDraft(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) return null;
    return _DailyDraft.fromJson(decoded);
  }

  String _reanchorStrip(String centerDate) {
    final today = todayYmd();
    final minDate = addDaysYmd(today, -180);
    var start = addDaysYmd(centerDate, -6);
    if (addDaysYmd(start, _stripDays - 1).compareTo(today) > 0) {
      start = addDaysYmd(today, -(_stripDays - 1));
    }
    if (start.compareTo(minDate) < 0) start = minDate;
    return start;
  }

  List<String> get _stripDates =>
      List.generate(_stripDays, (index) => addDaysYmd(_stripStart, index));
  String get _minDate => addDaysYmd(todayYmd(), -180);
  bool get _canGoPrev => _selectedDate.compareTo(_minDate) > 0;
  bool get _canGoNext => _selectedDate.compareTo(todayYmd()) < 0;

  double get _padMl => _events
      .where((event) => event.eventType == 'pad')
      .fold(0.0, (sum, event) => sum + event.volumeMl);
  double get _tamponMl => _events
      .where((event) => event.eventType == 'tampon')
      .fold(0.0, (sum, event) => sum + event.volumeMl);
  double get _clotMl => _events
      .where((event) => event.eventType == 'symptom')
      .fold(0.0, (sum, event) => sum + event.volumeMl);
  double get _totalMl => _padMl + _tamponMl + _clotMl;
  bool get _dirty => jsonEncode(_currentDraft.toJson()) != _snapshot;

  _DailyDraft get _currentDraft => _DailyDraft(
    date: _selectedDate,
    dayColor: _dayColor,
    events: List<_LocalEvent>.from(_events),
  );

  Future<void> _persistDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    if (_events.isEmpty) {
      await storage.remove('${AppKeys.dailyDraftPrefix}$_selectedDate');
      return;
    }
    await storage.setJson(
      '${AppKeys.dailyDraftPrefix}$_selectedDate',
      jsonEncode(_currentDraft.toJson()),
    );
  }

  void _setStateAndDraft(VoidCallback action) {
    setState(action);
    _syncRangeMap();
    _persistDraft();
  }

  void _syncRangeMap() {
    if (_events.isEmpty) {
      _rangeMap.remove(_selectedDate);
      return;
    }
    _rangeMap[_selectedDate] = MenstrualDailySummary(
      date: _selectedDate,
      hasBleeding: _totalMl > 0,
      totalVolumeMl: _totalMl,
      dayColor: _dayColor,
    );
  }

  Future<void> _changeDate(String date) async {
    if (_dirty && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('当前修改已自动保存为草稿。')));
    }
    if (!_stripDates.contains(date)) {
      setState(() => _stripStart = _reanchorStrip(date));
      await _loadRange();
    }
    await _loadDate(date);
  }

  Future<void> _stepDate(int offset) async {
    if (offset == 0) return;
    final target = clampYmd(
      addDaysYmd(_selectedDate, offset),
      _minDate,
      todayYmd(),
    );
    if (target == _selectedDate) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(offset < 0 ? '已经是最早可记录日期' : '已经是今天')),
      );
      return;
    }
    await _changeDate(target);
  }

  void _addEvent({
    required String eventType,
    String? productType,
    String? model,
    String? symptomName,
    required double volumeMl,
  }) {
    final event = _LocalEvent(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      eventType: eventType,
      eventTime: DateTime.now().toIso8601String(),
      productType: productType,
      model: model,
      color: _dayColor,
      volumeMl: volumeMl,
      symptomName: symptomName,
    );
    _setStateAndDraft(() {
      _events.add(event);
      if (eventType == 'pad') _padUndoStack.add(event.id);
      if (eventType == 'tampon') _tamponUndoStack.add(event.id);
    });
  }

  void _removeEvent(String id) {
    _setStateAndDraft(() {
      _events.removeWhere((event) => event.id == id);
      _padUndoStack.remove(id);
      _tamponUndoStack.remove(id);
    });
  }

  void _undoLast(String type) {
    final stack = type == 'pad' ? _padUndoStack : _tamponUndoStack;
    if (stack.isEmpty) return;
    _removeEvent(stack.removeLast());
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref
          .read(menstrualApiProvider)
          .putDailyByDate(
            _selectedDate,
            MenstrualDailyInput(
              hasBleeding: _totalMl > 0,
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
      final storage = await ref.read(appStorageProvider.future);
      await storage.remove('${AppKeys.dailyDraftPrefix}$_selectedDate');
      if (storage.getString(AppKeys.dailyFirstCompletedAt) == null) {
        await storage.setString(
          AppKeys.dailyFirstCompletedAt,
          DateTime.now().millisecondsSinceEpoch.toString(),
        );
      }
      _snapshot = jsonEncode(_currentDraft.toJson());
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('已保存记录')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref.watch(sessionControllerProvider);
    final showTampon = session.user?.useTampon ?? _useTampon;

    if (_loadingPage) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return FlowPage(
      title: l10n.homeTitle,
      subtitle: '按日记录、草稿自动保存、14 天概览和更清晰的用品输入。',
      actions: [
        IconButton(
          onPressed: () async {
            setState(() => _stripStart = _reanchorStrip(todayYmd()));
            await _loadRange();
            await _changeDate(todayYmd());
          },
          icon: const Icon(Icons.today_outlined),
        ),
      ],
      children: [
        _SummaryCard(
          selectedDate: _selectedDate,
          totalMl: _totalMl,
          padMl: _padMl,
          tamponMl: _tamponMl,
          clotMl: _clotMl,
          dirty: _dirty,
          showBleeding: _showBleeding,
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
                    Text(
                      '最近 14 天',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const Spacer(),
                    OutlinedButton(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: parseYmd(_selectedDate),
                          firstDate: DateTime.now().subtract(
                            const Duration(days: 180),
                          ),
                          lastDate: DateTime.now(),
                        );
                        if (picked == null) return;
                        await _changeDate(ymdFromDate(picked));
                      },
                      child: Text(_selectedDate),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    IconButton.filledTonal(
                      onPressed: _loadingDetail || !_canGoPrev
                          ? null
                          : () => _stepDate(-1),
                      icon: const Icon(Icons.chevron_left),
                      tooltip: '前一天',
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            for (final date in _stripDates) ...[
                              _DayChip(
                                date: date,
                                selected: date == _selectedDate,
                                summary: _rangeMap[date],
                                onTap: () => _changeDate(date),
                              ),
                              const SizedBox(width: 8),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      onPressed: _loadingDetail || !_canGoNext
                          ? null
                          : () => _stepDate(1),
                      icon: const Icon(Icons.chevron_right),
                      tooltip: '后一天',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: _loadingDetail
                          ? null
                          : () => _changeDate(todayYmd()),
                      icon: const Icon(Icons.today_outlined),
                      label: const Text('回到今天'),
                    ),
                    if (_loadingDetail) const Chip(label: Text('正在切换日期')),
                    if (!_canGoPrev) const Chip(label: Text('已到最早日期')),
                    if (!_canGoNext) const Chip(label: Text('已到今天')),
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
                Text('颜色与症状', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final color in _colors)
                      ChoiceChip(
                        label: Text(_colorLabel(color)),
                        selected: _dayColor == color,
                        onSelected: (_) => _setStateAndDraft(() {
                          _dayColor = color;
                          for (var i = 0; i < _events.length; i++) {
                            _events[i] = _events[i].copyWith(color: color);
                          }
                        }),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () => _addEvent(
                        eventType: 'symptom',
                        symptomName: '小血块',
                        volumeMl: 2,
                      ),
                      child: const Text('+ 小血块'),
                    ),
                    OutlinedButton(
                      onPressed: () => _addEvent(
                        eventType: 'symptom',
                        symptomName: '大血块',
                        volumeMl: 4,
                      ),
                      child: const Text('+ 大血块'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_showPad) ...[
          _ProductInputCard(
            title: '卫生巾',
            selectedValue: _padType,
            options: const {
              'liner': '护垫',
              'day': '日用',
              'night': '夜用',
              'pants': '安睡裤',
            },
            inputMode: _padInputMode,
            volume: _padVolume,
            onValueChanged: (value) => setState(() => _padType = value),
            onVolumeChanged: (value) => setState(() => _padVolume = value),
            onQuickAdd: (value) => _addEvent(
              eventType: 'pad',
              productType: _padType,
              volumeMl: value,
            ),
            onSliderAdd: () => _addEvent(
              eventType: 'pad',
              productType: _padType,
              volumeMl: _padVolume,
            ),
            onUndo: _padUndoStack.isEmpty ? null : () => _undoLast('pad'),
          ),
          const SizedBox(height: 16),
        ],
        if (showTampon) ...[
          _ProductInputCard(
            title: '卫生棉条',
            selectedValue: _tamponModel,
            options: const {
              'mini': '迷你',
              'regular': '常规',
              'large': '大号',
              'super': '超大',
            },
            inputMode: _tamponInputMode,
            volume: _tamponVolume,
            onValueChanged: (value) => setState(() => _tamponModel = value),
            onVolumeChanged: (value) => setState(() => _tamponVolume = value),
            onQuickAdd: (value) => _addEvent(
              eventType: 'tampon',
              model: _tamponModel,
              volumeMl: value,
            ),
            onSliderAdd: () => _addEvent(
              eventType: 'tampon',
              model: _tamponModel,
              volumeMl: _tamponVolume,
            ),
            onUndo: _tamponUndoStack.isEmpty ? null : () => _undoLast('tampon'),
          ),
          const SizedBox(height: 16),
        ],
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('当日事件', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    if (_loadingDetail) const Text('加载中...'),
                  ],
                ),
                const SizedBox(height: 12),
                if (_events.isEmpty) const Text('今天还没有记录。'),
                if (_events.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final event in _events)
                        InputChip(
                          label: Text(_formatEvent(event)),
                          onDeleted: () => _removeEvent(event.id),
                        ),
                    ],
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: _saving ? null : _save,
                        child: Text(_saving ? '保存中...' : '保存记录'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _changeDate(todayYmd()),
                        child: Text(l10n.todaySummary),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _formatEvent(_LocalEvent event) {
    if (event.eventType == 'symptom') {
      return '症状 · ${event.symptomName}';
    }
    if (event.eventType == 'pad') {
      return '卫生巾 · ${_padTypeLabel(event.productType)} · ${event.volumeMl.toStringAsFixed(0)}mL';
    }
    return '棉条 · ${_tamponLabel(event.model)} · ${event.volumeMl.toStringAsFixed(0)}mL';
  }

  String _padTypeLabel(String? type) =>
      const {'liner': '护垫', 'day': '日用', 'night': '夜用', 'pants': '安睡裤'}[type] ??
      '卫生巾';

  String _tamponLabel(String? value) =>
      const {
        'mini': '迷你',
        'regular': '常规',
        'large': '大号',
        'super': '超大',
      }[value] ??
      '棉条';

  String _colorLabel(String value) =>
      const {
        'pink': '粉',
        'red': '红',
        'rust': '锈红',
        'dark': '深红',
        'brown': '棕',
      }[value] ??
      value;
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.selectedDate,
    required this.totalMl,
    required this.padMl,
    required this.tamponMl,
    required this.clotMl,
    required this.dirty,
    required this.showBleeding,
  });

  final String selectedDate;
  final double totalMl;
  final double padMl;
  final double tamponMl;
  final double clotMl;
  final bool dirty;
  final bool showBleeding;

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
                  selectedDate,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                if (dirty)
                  const Chip(
                    label: Text('草稿未提交'),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              showBleeding
                  ? '总量 ${totalMl.toStringAsFixed(1)}mL'
                  : '已按设置隐藏实时血量展示',
            ),
            if (showBleeding) ...[
              const SizedBox(height: 12),
              LinearProgressIndicator(
                value: (totalMl / 40).clamp(0, 1),
                minHeight: 10,
                borderRadius: BorderRadius.circular(999),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _MiniMetric(
                    label: '卫生巾',
                    value: '${padMl.toStringAsFixed(1)}mL',
                  ),
                  _MiniMetric(
                    label: '棉条',
                    value: '${tamponMl.toStringAsFixed(1)}mL',
                  ),
                  _MiniMetric(
                    label: '血块估算',
                    value: '${clotMl.toStringAsFixed(1)}mL',
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.65),
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

class _DayChip extends StatelessWidget {
  const _DayChip({
    required this.date,
    required this.selected,
    required this.summary,
    required this.onTap,
  });

  final String date;
  final bool selected;
  final MenstrualDailySummary? summary;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = switch (summary?.dayColor) {
      'pink' => const Color(0xFFF8C8D4),
      'red' => const Color(0xFFE77A7A),
      'rust' => const Color(0xFFD38A73),
      'dark' => const Color(0xFF8E4A52),
      'brown' => const Color(0xFF8A6B58),
      _ => const Color(0xFFE9D6D0),
    };
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        width: 74,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF3B2A2A)
              : Colors.white.withValues(alpha: 0.75),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: selected ? const Color(0xFF3B2A2A) : const Color(0xFFE4D7D0),
          ),
        ),
        child: Column(
          children: [
            Text(
              date.substring(5),
              style: TextStyle(
                color: selected ? Colors.white : Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(height: 6),
            Text(
              summary == null
                  ? '--'
                  : '${summary!.totalVolumeMl.toStringAsFixed(0)}mL',
              style: TextStyle(
                fontSize: 12,
                color: selected ? Colors.white70 : Colors.black54,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductInputCard extends StatelessWidget {
  const _ProductInputCard({
    required this.title,
    required this.selectedValue,
    required this.options,
    required this.inputMode,
    required this.volume,
    required this.onValueChanged,
    required this.onVolumeChanged,
    required this.onQuickAdd,
    required this.onSliderAdd,
    required this.onUndo,
  });

  final String title;
  final String selectedValue;
  final Map<String, String> options;
  final String inputMode;
  final double volume;
  final ValueChanged<String> onValueChanged;
  final ValueChanged<double> onVolumeChanged;
  final ValueChanged<double> onQuickAdd;
  final VoidCallback onSliderAdd;
  final VoidCallback? onUndo;

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
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                if (onUndo != null)
                  TextButton.icon(
                    onPressed: onUndo,
                    icon: const Icon(Icons.undo, size: 18),
                    label: const Text('撤销'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: selectedValue,
              items: [
                for (final entry in options.entries)
                  DropdownMenuItem(value: entry.key, child: Text(entry.value)),
              ],
              onChanged: (value) {
                if (value != null) onValueChanged(value);
              },
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            if (inputMode == 'drag') ...[
              Slider(
                value: volume,
                min: 1,
                max: 20,
                divisions: 19,
                label: '${volume.toStringAsFixed(0)}mL',
                onChanged: onVolumeChanged,
              ),
              FilledButton.tonal(
                onPressed: onSliderAdd,
                child: Text('添加 ${volume.toStringAsFixed(0)}mL'),
              ),
            ] else ...[
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final quick in _HomePageState._quickVolumes)
                    OutlinedButton(
                      onPressed: () => onQuickAdd(quick),
                      child: Text('${quick.toStringAsFixed(0)}mL'),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DailyDraft {
  const _DailyDraft({
    required this.date,
    required this.dayColor,
    required this.events,
  });

  final String date;
  final String dayColor;
  final List<_LocalEvent> events;

  factory _DailyDraft.fromDetail(MenstrualDailyDetail detail) {
    final fallbackColor = detail.dayColor ?? 'red';
    return _DailyDraft(
      date: detail.date,
      dayColor: fallbackColor,
      events: detail.events
          .map(
            (event) => _LocalEvent(
              id: '${event.id}',
              eventType: event.eventType,
              eventTime: event.eventTime,
              productType: event.productType,
              model: event.model,
              color: event.color ?? fallbackColor,
              volumeMl: event.volumeMl ?? 0,
              symptomName: event.symptomName,
            ),
          )
          .toList(),
    );
  }

  factory _DailyDraft.fromJson(Map<String, dynamic> json) {
    final list = (json['events'] as List<dynamic>? ?? const [])
        .map((item) => _LocalEvent.fromJson(item as Map<String, dynamic>))
        .toList();
    return _DailyDraft(
      date: json['date']?.toString() ?? todayYmd(),
      dayColor: json['dayColor']?.toString() ?? 'red',
      events: list,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'dayColor': dayColor,
      'events': events.map((event) => event.toJson()).toList(),
    };
  }
}

class _LocalEvent {
  const _LocalEvent({
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
  final double volumeMl;
  final String? symptomName;

  _LocalEvent copyWith({String? color}) {
    return _LocalEvent(
      id: id,
      eventType: eventType,
      eventTime: eventTime,
      productType: productType,
      model: model,
      color: color ?? this.color,
      volumeMl: volumeMl,
      symptomName: symptomName,
    );
  }

  factory _LocalEvent.fromJson(Map<String, dynamic> json) {
    return _LocalEvent(
      id: json['id']?.toString() ?? '',
      eventType: json['eventType']?.toString() ?? 'pad',
      eventTime:
          json['eventTime']?.toString() ?? DateTime.now().toIso8601String(),
      productType: json['productType']?.toString(),
      model: json['model']?.toString(),
      color: json['color']?.toString(),
      volumeMl: (json['volumeMl'] as num?)?.toDouble() ?? 0,
      symptomName: json['symptomName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventType': eventType,
      'eventTime': eventTime,
      'productType': productType,
      'model': model,
      'color': color,
      'volumeMl': volumeMl,
      'symptomName': symptomName,
    };
  }
}
