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
  bool _isDirty = false;
  bool _hasLocalDraft = false;
  DateTime? _draftSavedAt;
  DateTime? _serverSavedAt;
  String? _saveErrorText;

  @override
  void initState() {
    super.initState();
    Future.microtask(_bootstrap);
  }

  Future<void> _bootstrap() async {
    final session = ref.read(sessionControllerProvider);
    final storage = await ref.read(appStorageProvider.future);
    final visibility =
        storage.getJsonMap(AppKeys.visibilitySettings) ?? const {};
    final inputMode = storage.getJsonMap(AppKeys.inputModeSettings) ?? const {};
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
      ).showSnackBar(const SnackBar(content: Text('已定位到最近一次开始日，建议先补这一天。')));
    }

    if (mounted) {
      setState(() => _loadingPage = false);
    }
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
        storage.getJsonMap('${AppKeys.dailyDraftPrefix}$date'),
      );
      final local = draft ?? _DailyDraft.fromDetail(detail);
      _events
        ..clear()
        ..addAll(local.events);
      _padUndoStack.clear();
      _tamponUndoStack.clear();
      if (!mounted) return;
      setState(() {
        _selectedDate = date;
        _dayColor = local.dayColor;
        _padVolume = 5;
        _tamponVolume = 5;
        _isDirty = false;
        _hasLocalDraft = draft != null;
        _draftSavedAt = local.updatedAt;
        _serverSavedAt = draft == null ? DateTime.now() : null;
        _saveErrorText = null;
      });
    } finally {
      if (mounted) setState(() => _loadingDetail = false);
    }
  }

  _DailyDraft? _readDraft(Map<String, dynamic>? data) {
    if (data == null) return null;
    return _DailyDraft.fromJson(data);
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
  bool get _hasPendingDraft => _isDirty || _hasLocalDraft;

  _DailyDraft get _currentDraft => _DailyDraft(
    date: _selectedDate,
    dayColor: _dayColor,
    events: List<_LocalEvent>.from(_events),
    updatedAt: _draftSavedAt,
  );

  Future<void> _persistDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    if (_events.isEmpty) {
      await storage.remove('${AppKeys.dailyDraftPrefix}$_selectedDate');
      return;
    }
    await storage.setJsonMap(
      '${AppKeys.dailyDraftPrefix}$_selectedDate',
      _currentDraft.toJson(),
    );
  }

  void _setStateAndDraft(VoidCallback action) {
    setState(() {
      action();
      _isDirty = true;
      _hasLocalDraft = true;
      _draftSavedAt = DateTime.now();
      _saveErrorText = null;
    });
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(offset < 0 ? '已到最早日期' : '已是今天')));
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

  Future<void> _removeEventWithUndo(_LocalEvent event) async {
    final index = _events.indexWhere((item) => item.id == event.id);
    if (index < 0) return;
    _removeEvent(event.id);
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    final controller = messenger.showSnackBar(
      SnackBar(
        content: Text('已删除${_formatDeleteTarget(event)}'),
        action: SnackBarAction(
          label: '撤销',
          onPressed: () {
            _setStateAndDraft(() {
              final safeIndex = index.clamp(0, _events.length);
              _events.insert(safeIndex, event);
              if (event.eventType == 'pad') {
                _padUndoStack.add(event.id);
              }
              if (event.eventType == 'tampon') {
                _tamponUndoStack.add(event.id);
              }
            });
          },
        ),
      ),
    );
    await controller.closed;
  }

  Future<void> _editEvent(_LocalEvent event) async {
    String? productType = event.productType;
    String? model = event.model;
    String color = event.color ?? _dayColor;
    double volumeMl = event.volumeMl;
    String? symptomName = event.symptomName;

    final action = await showModalBottomSheet<_EventSheetAction>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isSymptom = event.eventType == 'symptom';
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('编辑事件', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  if (!isSymptom) ...[
                    DropdownButtonFormField<String>(
                      initialValue: event.eventType == 'pad'
                          ? productType
                          : model,
                      items: [
                        for (final entry
                            in (event.eventType == 'pad'
                                    ? const {
                                        'liner': '护垫',
                                        'day': '日用',
                                        'night': '夜用',
                                        'pants': '安睡裤',
                                      }
                                    : const {
                                        'mini': '迷你',
                                        'regular': '常规',
                                        'large': '大号',
                                        'super': '超大',
                                      })
                                .entries)
                          DropdownMenuItem(
                            value: entry.key,
                            child: Text(entry.value),
                          ),
                      ],
                      onChanged: (value) {
                        setSheetState(() {
                          if (event.eventType == 'pad') {
                            productType = value;
                          } else {
                            model = value;
                          }
                        });
                      },
                      decoration: InputDecoration(
                        labelText: event.eventType == 'pad' ? '卫生巾类型' : '棉条型号',
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('血量 ${volumeMl.toStringAsFixed(0)}mL'),
                    Slider(
                      value: volumeMl.clamp(1, 20),
                      min: 1,
                      max: 20,
                      divisions: 19,
                      label: '${volumeMl.toStringAsFixed(0)}mL',
                      onChanged: (value) =>
                          setSheetState(() => volumeMl = value),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final option in _colors)
                          ChoiceChip(
                            label: Text(_colorLabel(option)),
                            selected: color == option,
                            onSelected: (_) =>
                                setSheetState(() => color = option),
                          ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      '血块类型',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        ChoiceChip(
                          label: const Text('小血块'),
                          selected: symptomName == '小血块',
                          onSelected: (_) => setSheetState(() {
                            symptomName = '小血块';
                            volumeMl = 2;
                          }),
                        ),
                        ChoiceChip(
                          label: const Text('大血块'),
                          selected: symptomName == '大血块',
                          onSelected: (_) => setSheetState(() {
                            symptomName = '大血块';
                            volumeMl = 4;
                          }),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () =>
                            Navigator.of(context).pop(_EventSheetAction.delete),
                        child: const Text('删除'),
                      ),
                      const Spacer(),
                      OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('取消'),
                      ),
                      const SizedBox(width: 12),
                      FilledButton(
                        onPressed: () {
                          _setStateAndDraft(() {
                            final index = _events.indexWhere(
                              (item) => item.id == event.id,
                            );
                            if (index < 0) return;
                            _events[index] = event.copyWith(
                              productType: productType,
                              model: model,
                              color: color,
                              volumeMl: volumeMl,
                              symptomName: symptomName,
                            );
                          });
                          Navigator.of(context).pop(_EventSheetAction.save);
                        },
                        child: const Text('保存修改'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (action == _EventSheetAction.delete) {
      await _removeEventWithUndo(event);
    }
  }

  void _undoLast(String type) {
    final stack = type == 'pad' ? _padUndoStack : _tamponUndoStack;
    if (stack.isEmpty) return;
    _removeEvent(stack.removeLast());
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _saveErrorText = null;
    });
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
      if (!mounted) return;
      setState(() {
        _isDirty = false;
        _hasLocalDraft = false;
        _serverSavedAt = DateTime.now();
        _saveErrorText = null;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('已保存记录')));
    } catch (_) {
      if (mounted) {
        setState(() => _saveErrorText = '提交失败，当前修改仍保留在本地草稿');
      }
      rethrow;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final showTampon = ref.watch(
      sessionControllerProvider.select(
        (state) => state.user?.useTampon ?? _useTampon,
      ),
    );

    if (_loadingPage) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return FlowPage(
      title: l10n.homeTitle,
      subtitle: '按天记录，草稿会自动保存。',
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
          dirty: _hasPendingDraft,
          showBleeding: _showBleeding,
          saving: _saving,
          draftSavedAt: _draftSavedAt,
          serverSavedAt: _serverSavedAt,
          saveErrorText: _saveErrorText,
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
                Text(
                  '点日期切换；圆点看颜色，数字看总量。',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.62),
                  ),
                ),
                const SizedBox(height: 14),
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
                      label: const Text('今天'),
                    ),
                    if (_loadingDetail) const Chip(label: Text('切换中')),
                    if (!_canGoPrev) const Chip(label: Text('已到最早日期')),
                    if (!_canGoNext) const Chip(label: Text('已到今天')),
                  ],
                ),
                if (_hasPendingDraft) ...[
                  const SizedBox(height: 12),
                  _SaveStatePill(
                    saving: _saving,
                    dirty: _hasPendingDraft,
                    draftSavedAt: _draftSavedAt,
                    serverSavedAt: _serverSavedAt,
                    saveErrorText: _saveErrorText,
                  ),
                ],
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
                  '标记颜色与血块',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 6),
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
                Text(
                  '已记录项目',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text('今日记录', style: Theme.of(context).textTheme.titleLarge),
                    const Spacer(),
                    if (_loadingDetail) const Text('加载中...'),
                  ],
                ),
                const SizedBox(height: 12),
                if (_events.isEmpty) const Text('今天还没记录。'),
                if (_events.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final event in _events)
                        InputChip(
                          label: Text(_formatEvent(event)),
                          onPressed: () => _editEvent(event),
                          onDeleted: () => _removeEventWithUndo(event),
                        ),
                    ],
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        onPressed:
                            _saving || _loadingDetail || !_hasPendingDraft
                            ? null
                            : _save,
                        child: Text(
                          _saving
                              ? '保存中...'
                              : _hasPendingDraft
                              ? '保存记录'
                              : '已同步',
                        ),
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

  String _formatDeleteTarget(_LocalEvent event) {
    if (event.eventType == 'symptom') {
      return '「${event.symptomName ?? '症状'}」';
    }
    if (event.eventType == 'pad') {
      return '卫生巾记录';
    }
    return '棉条记录';
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
    required this.saving,
    required this.draftSavedAt,
    required this.serverSavedAt,
    required this.saveErrorText,
  });

  final String selectedDate;
  final double totalMl;
  final double padMl;
  final double tamponMl;
  final double clotMl;
  final bool dirty;
  final bool showBleeding;
  final bool saving;
  final DateTime? draftSavedAt;
  final DateTime? serverSavedAt;
  final String? saveErrorText;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF9B4A5C), Color(0xFF7E3646), Color(0xFF5F2632)],
        ),
        borderRadius: BorderRadius.circular(34),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.22),
            blurRadius: 36,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'TODAY RECORD',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.1,
                  ),
                ),
              ),
              const Spacer(),
              if (dirty)
                const Chip(
                  label: Text('草稿未提交'),
                  visualDensity: VisualDensity.compact,
                  labelStyle: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                  backgroundColor: Color(0x33FFFFFF),
                  side: BorderSide(color: Color(0x22FFFFFF)),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            selectedDate,
            style: theme.textTheme.displaySmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            showBleeding ? '今日总量 ${totalMl.toStringAsFixed(1)}mL' : '实时血量已隐藏',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.82),
            ),
          ),
          const SizedBox(height: 12),
          _SaveStatePill(
            saving: saving,
            dirty: dirty,
            draftSavedAt: draftSavedAt,
            serverSavedAt: serverSavedAt,
            saveErrorText: saveErrorText,
            darkMode: true,
          ),
          if (showBleeding) ...[
            const SizedBox(height: 18),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: (totalMl / 40).clamp(0, 1),
                minHeight: 12,
                backgroundColor: Colors.white.withValues(alpha: 0.12),
                valueColor: const AlwaysStoppedAnimation(Color(0xFFFFD7C2)),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _MiniMetric(
                    label: '卫生巾',
                    value: '${padMl.toStringAsFixed(1)}mL',
                    inverse: true,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MiniMetric(
                    label: '棉条',
                    value: '${tamponMl.toStringAsFixed(1)}mL',
                    inverse: true,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MiniMetric(
                    label: '血块估算',
                    value: '${clotMl.toStringAsFixed(1)}mL',
                    inverse: true,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SaveStatePill extends StatelessWidget {
  const _SaveStatePill({
    required this.saving,
    required this.dirty,
    required this.draftSavedAt,
    required this.serverSavedAt,
    required this.saveErrorText,
    this.darkMode = false,
  });

  final bool saving;
  final bool dirty;
  final DateTime? draftSavedAt;
  final DateTime? serverSavedAt;
  final String? saveErrorText;
  final bool darkMode;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    String text;
    Color bg;
    Color fg;

    if (saving) {
      text = '正在同步';
      bg = colorScheme.primaryContainer;
      fg = colorScheme.onPrimaryContainer;
    } else if (saveErrorText != null) {
      text = saveErrorText!;
      bg = colorScheme.errorContainer;
      fg = colorScheme.onErrorContainer;
    } else if (dirty && draftSavedAt != null) {
      text = '草稿已保存 ${_formatTime(draftSavedAt!)}';
      bg = const Color(0xFFF6E7D8);
      fg = const Color(0xFF6F4B2A);
    } else if (serverSavedAt != null) {
      text = '已同步 ${_formatTime(serverSavedAt!)}';
      bg = const Color(0xFFE3F2E7);
      fg = const Color(0xFF245B34);
    } else {
      text = '当前为云端记录';
      bg = const Color(0xFFECE9E7);
      fg = const Color(0xFF534846);
    }

    if (darkMode) {
      bg = Colors.white.withValues(alpha: 0.12);
      fg = Colors.white;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        text,
        style: TextStyle(color: fg, fontWeight: FontWeight.w600),
      ),
    );
  }

  String _formatTime(DateTime value) {
    final hh = value.hour.toString().padLeft(2, '0');
    final mm = value.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({
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
            : Colors.white.withValues(alpha: 0.65),
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
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
        width: 84,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF543038)
              : Colors.white.withValues(alpha: 0.75),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? const Color(0xFF543038) : const Color(0xFFE4D7D0),
          ),
        ),
        child: Column(
          children: [
            Text(
              date.substring(5),
              style: TextStyle(
                color: selected ? Colors.white : Colors.black87,
                fontWeight: FontWeight.w700,
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
                fontWeight: FontWeight.w700,
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
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title == '卫生巾' ? '快速录入' : '补充录入',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(title, style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
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
            Text(
              inputMode == 'drag' ? '拖拽选择更精确的 mL 值。' : '点击预设值即可快速添加。',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
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
    required this.updatedAt,
  });

  final String date;
  final String dayColor;
  final List<_LocalEvent> events;
  final DateTime? updatedAt;

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
      updatedAt: null,
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
      updatedAt: _readDateTime(json['updatedAt']?.toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'dayColor': dayColor,
      'events': events.map((event) => event.toJson()).toList(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static DateTime? _readDateTime(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw);
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

  _LocalEvent copyWith({
    String? productType,
    String? model,
    String? color,
    double? volumeMl,
    String? symptomName,
  }) {
    return _LocalEvent(
      id: id,
      eventType: eventType,
      eventTime: eventTime,
      productType: productType ?? this.productType,
      model: model ?? this.model,
      color: color ?? this.color,
      volumeMl: volumeMl ?? this.volumeMl,
      symptomName: symptomName ?? this.symptomName,
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

enum _EventSheetAction { save, delete }
