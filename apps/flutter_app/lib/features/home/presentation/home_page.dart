import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_storage.dart';
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
  late final Future<AppStorage> _storageFuture;
  late final MenstrualApi _menstrualApi;

  @override
  void initState() {
    super.initState();
    _storageFuture = ref.read(appStorageProvider.future);
    _menstrualApi = ref.read(menstrualApiProvider);
    Future.microtask(_bootstrap);
  }

  Future<void> _bootstrap() async {
    final session = ref.read(sessionControllerProvider);
    final storage = await _storageFuture;
    if (!mounted) return;
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

    if (!mounted) return;
    await _loadRange();
    if (!mounted) return;
    await _loadDate(initial);
    if (!mounted) return;

    if ((firstCompleted == null || firstCompleted.isEmpty) &&
        storage.getString(AppKeys.dailyFirstGuideShown) != '1') {
      await storage.setString(AppKeys.dailyFirstGuideShown, '1');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.firstDayGuide)),
      );
    }

    if (mounted) {
      setState(() => _loadingPage = false);
    }
  }

  Future<void> _loadRange() async {
    final end = addDaysYmd(_stripStart, _stripDays - 1);
    final items = await _menstrualApi.getDailyRange(_stripStart, end);
    if (!mounted) return;
    setState(() {
      _rangeMap
        ..clear()
        ..addEntries(items.map((item) => MapEntry(item.date, item)));
    });
  }

  Future<void> _loadDate(String date) async {
    if (!mounted) return;
    setState(() => _loadingDetail = true);
    try {
      final detail = await _menstrualApi.getDailyByDate(date);
      final storage = await _storageFuture;
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
    final storage = await _storageFuture;
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            offset < 0
                ? AppLocalizations.of(context)!.earliestDateReached
                : AppLocalizations.of(context)!.todayReached,
          ),
        ),
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

  Future<void> _removeEventWithUndo(_LocalEvent event) async {
    final l10n = AppLocalizations.of(context)!;
    final index = _events.indexWhere((item) => item.id == event.id);
    if (index < 0) return;
    _removeEvent(event.id);
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    final controller = messenger.showSnackBar(
      SnackBar(
        content: Text(l10n.deletedEvent(_formatDeleteTarget(l10n, event))),
        action: SnackBarAction(
          label: l10n.undo,
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
    final l10n = AppLocalizations.of(context)!;
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
                  Text(
                    l10n.editEvent,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  if (!isSymptom) ...[
                    DropdownButtonFormField<String>(
                      initialValue: event.eventType == 'pad'
                          ? productType
                          : model,
                      items: [
                        for (final entry
                            in (event.eventType == 'pad'
                                    ? _padOptions(l10n)
                                    : _tamponOptions(l10n))
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
                        labelText: event.eventType == 'pad'
                            ? l10n.padType
                            : l10n.tamponModel,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(l10n.bleedingVolume(volumeMl.toStringAsFixed(0))),
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
                            label: Text(_colorLabel(l10n, option)),
                            selected: color == option,
                            onSelected: (_) =>
                                setSheetState(() => color = option),
                          ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      l10n.clotType,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        ChoiceChip(
                          label: Text(l10n.smallClot),
                          selected: symptomName == '小血块',
                          onSelected: (_) => setSheetState(() {
                            symptomName = '小血块';
                            volumeMl = 2;
                          }),
                        ),
                        ChoiceChip(
                          label: Text(l10n.largeClot),
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
                        child: Text(l10n.delete),
                      ),
                      const Spacer(),
                      OutlinedButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(l10n.cancel),
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
                        child: Text(l10n.saveChanges),
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
      await _menstrualApi.putDailyByDate(
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
      final storage = await _storageFuture;
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.recordSaved)),
      );
    } catch (_) {
      if (mounted) {
        setState(
          () => _saveErrorText = AppLocalizations.of(
            context,
          )!.recordSaveFailedDraftKept,
        );
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
      subtitle: l10n.homeSubtitleActive,
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
                      l10n.recentDays,
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
                  l10n.dateStripHint,
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
                      tooltip: l10n.previousDay,
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
                              const SizedBox(width: 6),
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
                      tooltip: l10n.nextDay,
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
                      label: Text(l10n.today),
                    ),
                    if (_loadingDetail) Chip(label: Text(l10n.switching)),
                    if (!_canGoPrev)
                      Chip(label: Text(l10n.earliestDateReached)),
                    if (!_canGoNext) Chip(label: Text(l10n.todayLimit)),
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
                  l10n.markColorAndClots,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.colorAndSymptoms,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final color in _colors)
                      ChoiceChip(
                        label: Text(_colorLabel(l10n, color)),
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
                      child: Text(l10n.addSmallClot),
                    ),
                    OutlinedButton(
                      onPressed: () => _addEvent(
                        eventType: 'symptom',
                        symptomName: '大血块',
                        volumeMl: 4,
                      ),
                      child: Text(l10n.addLargeClot),
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
            title: l10n.pad,
            kind: _ProductVisualKind.pad,
            selectedValue: _padType,
            options: _padOptions(l10n),
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
            title: l10n.tampon,
            kind: _ProductVisualKind.tampon,
            selectedValue: _tamponModel,
            options: _tamponOptions(l10n),
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
                  l10n.recordedItems,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(
                      l10n.todayRecords,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const Spacer(),
                    if (_loadingDetail) Text(l10n.loading),
                  ],
                ),
                const SizedBox(height: 12),
                if (_events.isEmpty) Text(l10n.noRecordsToday),
                if (_events.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final event in _events)
                        InputChip(
                          label: Text(_formatEvent(l10n, event)),
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
                              ? l10n.saving
                              : _hasPendingDraft
                              ? l10n.saveRecord
                              : l10n.synced,
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

  String _formatEvent(AppLocalizations l10n, _LocalEvent event) {
    if (event.eventType == 'symptom') {
      return l10n.symptomEvent(event.symptomName ?? l10n.symptom);
    }
    if (event.eventType == 'pad') {
      return l10n.padEvent(
        _padTypeLabel(l10n, event.productType),
        event.volumeMl.toStringAsFixed(0),
      );
    }
    return l10n.tamponEvent(
      _tamponLabel(l10n, event.model),
      event.volumeMl.toStringAsFixed(0),
    );
  }

  String _formatDeleteTarget(AppLocalizations l10n, _LocalEvent event) {
    if (event.eventType == 'symptom') {
      return l10n.quotedEvent(event.symptomName ?? l10n.symptom);
    }
    if (event.eventType == 'pad') {
      return l10n.padRecord;
    }
    return l10n.tamponRecord;
  }

  Map<String, String> _padOptions(AppLocalizations l10n) => {
    'liner': l10n.padLiner,
    'day': l10n.padDay,
    'night': l10n.padNight,
    'pants': l10n.padPants,
  };

  Map<String, String> _tamponOptions(AppLocalizations l10n) => {
    'mini': l10n.tamponMini,
    'regular': l10n.tamponRegular,
    'large': l10n.tamponLarge,
    'super': l10n.tamponSuper,
  };

  String _padTypeLabel(AppLocalizations l10n, String? type) =>
      _padOptions(l10n)[type] ?? l10n.pad;

  String _tamponLabel(AppLocalizations l10n, String? value) =>
      _tamponOptions(l10n)[value] ?? l10n.tampon;

  String _colorLabel(AppLocalizations l10n, String value) =>
      {
        'pink': l10n.colorPink,
        'red': l10n.colorRed,
        'rust': l10n.colorRust,
        'dark': l10n.colorDark,
        'brown': l10n.colorBrown,
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
    final l10n = AppLocalizations.of(context)!;
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
                Chip(
                  label: Text(l10n.draftPending),
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
            showBleeding
                ? l10n.todayTotal(totalMl.toStringAsFixed(1))
                : l10n.realtimeVolumeHidden,
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
                    label: l10n.pad,
                    value: '${padMl.toStringAsFixed(1)}mL',
                    inverse: true,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MiniMetric(
                    label: l10n.tampon,
                    value: '${tamponMl.toStringAsFixed(1)}mL',
                    inverse: true,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MiniMetric(
                    label: l10n.clotEstimate,
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
    final l10n = AppLocalizations.of(context)!;
    String text;
    Color bg;
    Color fg;

    if (saving) {
      text = l10n.syncing;
      bg = colorScheme.primaryContainer;
      fg = colorScheme.onPrimaryContainer;
    } else if (saveErrorText != null) {
      text = saveErrorText!;
      bg = colorScheme.errorContainer;
      fg = colorScheme.onErrorContainer;
    } else if (dirty && draftSavedAt != null) {
      text = l10n.draftSavedAt(_formatTime(draftSavedAt!));
      bg = const Color(0xFFF6E7D8);
      fg = const Color(0xFF6F4B2A);
    } else if (serverSavedAt != null) {
      text = l10n.syncedAt(_formatTime(serverSavedAt!));
      bg = const Color(0xFFE3F2E7);
      fg = const Color(0xFF245B34);
    } else {
      text = l10n.cloudRecord;
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
        width: 62,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 11),
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
                fontSize: 12,
                color: selected ? Colors.white : Colors.black87,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(height: 4),
            Text(
              summary == null
                  ? '--'
                  : '${summary!.totalVolumeMl.toStringAsFixed(0)}mL',
              style: TextStyle(
                fontSize: 10,
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

enum _ProductVisualKind { pad, tampon }

class _ProductInputCard extends StatelessWidget {
  const _ProductInputCard({
    required this.title,
    required this.kind,
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
  final _ProductVisualKind kind;
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
    final l10n = AppLocalizations.of(context)!;
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
                      kind == _ProductVisualKind.pad
                          ? l10n.quickInput
                          : l10n.additionalInput,
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
                    label: Text(l10n.undo),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              inputMode == 'drag'
                  ? l10n.precisionInputHint
                  : l10n.quickInputHint,
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
              _InlinePrecisionStage(
                kind: kind,
                selectedValue: selectedValue,
                options: options,
                volume: volume,
              ),
              const SizedBox(height: 14),
              Slider(
                value: volume,
                min: 1,
                max: 20,
                divisions: 190,
                label: '${volume.toStringAsFixed(1)}mL',
                onChanged: onVolumeChanged,
              ),
              Row(
                children: [
                  _MiniScaleHint(label: l10n.volumeLow, value: '3mL'),
                  const Spacer(),
                  _MiniScaleHint(label: l10n.volumeMedium, value: '6mL'),
                  const Spacer(),
                  _MiniScaleHint(label: l10n.volumeHigh, value: '10mL'),
                ],
              ),
              const SizedBox(height: 10),
              FilledButton.tonal(
                onPressed: onSliderAdd,
                child: Text(l10n.addVolume(volume.toStringAsFixed(1))),
              ),
            ] else ...[
              SizedBox(
                height: 204,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _HomePageState._quickVolumes.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final quick = _HomePageState._quickVolumes[index];
                    return _QuickVolumeCard(
                      kind: kind,
                      selectedValue: selectedValue,
                      label: options[selectedValue] ?? '',
                      volume: quick,
                      onTap: () => onQuickAdd(quick),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _QuickVolumeCard extends StatelessWidget {
  const _QuickVolumeCard({
    required this.kind,
    required this.selectedValue,
    required this.label,
    required this.volume,
    required this.onTap,
  });

  final _ProductVisualKind kind;
  final String selectedValue;
  final String label;
  final double volume;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Container(
        width: 142,
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF9F3EE),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE7DAD2)),
        ),
        child: Column(
          children: [
            Text(
              '${volume.toStringAsFixed(0)}mL',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: Center(
                child: kind == _ProductVisualKind.pad
                    ? _HomePadPrecisionStage(
                        padType: selectedValue,
                        volume: volume,
                        compact: true,
                      )
                    : _HomeTamponPrecisionStage(
                        model: selectedValue,
                        volume: volume,
                        compact: true,
                      ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF5C313B),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                l10n.tapToAdd,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniScaleHint extends StatelessWidget {
  const _MiniScaleHint({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(
      context,
    ).colorScheme.onSurface.withValues(alpha: 0.54);
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 11, color: color)),
      ],
    );
  }
}

class _InlinePrecisionStage extends StatelessWidget {
  const _InlinePrecisionStage({
    required this.kind,
    required this.selectedValue,
    required this.options,
    required this.volume,
  });

  final _ProductVisualKind kind;
  final String selectedValue;
  final Map<String, String> options;
  final double volume;

  @override
  Widget build(BuildContext context) {
    final label = options[selectedValue] ?? '';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F3EE),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE7DAD2)),
      ),
      child: Column(
        children: [
          Text(
            '$label · ${volume.toStringAsFixed(1)}mL',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF7F6056),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          if (kind == _ProductVisualKind.pad)
            _HomePadPrecisionStage(padType: selectedValue, volume: volume)
          else
            _HomeTamponPrecisionStage(model: selectedValue, volume: volume),
        ],
      ),
    );
  }
}

class _HomePadPrecisionStage extends StatelessWidget {
  const _HomePadPrecisionStage({
    required this.padType,
    required this.volume,
    this.compact = false,
  });

  final String padType;
  final double volume;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = _homeBloodPalette();
    final size = _homePadBodySize(padType);
    final stain = _homePadStainSize(volume, size);
    final showPants = padType == 'pants';

    return SizedBox(
      width: compact ? 112 : 160,
      height: compact ? 118 : 190,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: compact ? 12 : 22,
            child: _HomePadWing(left: true, compact: compact),
          ),
          Positioned(
            right: compact ? 12 : 22,
            child: _HomePadWing(left: false, compact: compact),
          ),
          if (showPants)
            Positioned(
              top: compact ? 12 : 16,
              child: Container(
                width: compact ? 92 : 126,
                height: compact ? 92 : 146,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(58),
                  border: Border.all(color: const Color(0xFFD8C8C0), width: 2),
                ),
              ),
            ),
          Container(
            width: size.width,
            height: size.height,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(42),
              border: Border.all(color: const Color(0xFFE3D5CE)),
            ),
          ),
          Container(
            width: size.width * 0.34,
            height: size.height * 0.74,
            decoration: BoxDecoration(
              color: const Color(0xFFF6EFEB),
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            width: stain.width,
            height: stain.height,
            decoration: BoxDecoration(
              color: palette.fill.withValues(alpha: stain.opacity),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: palette.outline.withValues(
                  alpha: stain.opacity.clamp(0.16, 0.42),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomePadWing extends StatelessWidget {
  const _HomePadWing({required this.left, this.compact = false});

  final bool left;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: left ? -0.24 : 0.24,
      child: Container(
        width: compact ? 20 : 30,
        height: compact ? 38 : 62,
        decoration: BoxDecoration(
          color: const Color(0xFFF8F3EF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE3D5CE)),
        ),
      ),
    );
  }
}

class _HomeTamponPrecisionStage extends StatelessWidget {
  const _HomeTamponPrecisionStage({
    required this.model,
    required this.volume,
    this.compact = false,
  });

  final String model;
  final double volume;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = _homeBloodPalette();
    final wetPercent = _homeTamponWetPercent(volume);
    final bodyHeight = _homeTamponBodyHeight(model);

    return SizedBox(
      width: compact ? 112 : 160,
      height: compact ? 118 : 190,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: compact ? 4 : 12,
            child: Container(
              width: compact ? 42 : 54,
              height: compact ? bodyHeight * 0.72 : bodyHeight,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: const Color(0xFFE3D5CE)),
              ),
              clipBehavior: Clip.antiAlias,
              child: Align(
                alignment: Alignment.bottomCenter,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  width: double.infinity,
                  height:
                      (compact ? bodyHeight * 0.72 : bodyHeight) * wetPercent,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        palette.fill,
                        palette.fill.withValues(alpha: 0.58),
                      ],
                    ),
                  ),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      width: double.infinity,
                      height: 6,
                      color: palette.outline.withValues(alpha: 0.34),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: compact ? 28 : 48,
            child: Container(
              width: compact ? 14 : 18,
              height: compact ? 20 : 28,
              decoration: BoxDecoration(
                color: const Color(0xFFF1E7E2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFD9CCC5)),
              ),
            ),
          ),
          Positioned(
            bottom: compact ? 2 : 8,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 260),
              curve: Curves.easeOutCubic,
              width: 2,
              height: compact ? 34 + wetPercent * 10 : 52 + wetPercent * 14,
              decoration: BoxDecoration(
                color: const Color(0xFFE0C7BF),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

({Color fill, Color outline}) _homeBloodPalette() =>
    (fill: const Color(0xFFC35A63), outline: const Color(0xFF8C3745));

Size _homePadBodySize(String padType) {
  switch (padType) {
    case 'liner':
      return const Size(56, 104);
    case 'night':
      return const Size(64, 150);
    case 'pants':
      return const Size(66, 142);
    case 'day':
    default:
      return const Size(62, 126);
  }
}

({double width, double height, double opacity}) _homePadStainSize(
  double volume,
  Size body,
) {
  final progress = ((volume.clamp(1, 20) - 1) / 19).clamp(0.0, 1.0);
  final width = body.width * (0.18 + progress * 0.56);
  final height = body.height * (0.18 + progress * 0.70);
  final opacity = 0.28 + progress * 0.52;
  return (width: width, height: height, opacity: opacity);
}

double _homeTamponWetPercent(double volume) {
  final progress = ((volume.clamp(1, 20) - 1) / 19).clamp(0.0, 1.0);
  return 0.10 + progress * 0.90;
}

double _homeTamponBodyHeight(String model) {
  switch (model) {
    case 'mini':
      return 92;
    case 'large':
      return 122;
    case 'super':
      return 136;
    case 'regular':
    default:
      return 108;
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
