import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';
import '../../../core/utils/date_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../data/question_bank.dart';
import '../data/visibility.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  bool _loading = true;
  bool _submitting = false;
  Map<String, dynamic> _answers = {};
  String? _currentId;
  Map<String, dynamic>? _draft;
  String _search = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final result = await ref.read(onboardingApiProvider).start();
      setState(() {
        _answers = result.answers;
        _currentId = result.currentQuestionId;
        _draft = _currentId == null ? null : _initDraft(_currentId!, _answers);
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _initDraft(String id, Map<String, dynamic> answers) {
    final def = questionDef(id);
    final answer = answers[id] as Map<String, dynamic>?;
    switch (def['type']) {
      case 'single':
        return {'kind': 'single', 'value': answer?['value']};
      case 'multi':
        return {
          'kind': 'multi',
          'values': List<String>.from(
            answer?['values'] as List<dynamic>? ?? const [],
          ),
        };
      case 'number':
        return {
          'kind': 'number',
          'value': answer?['value']?.toString() ?? '',
          'meta': Map<String, dynamic>.from(
            answer?['meta'] as Map<String, dynamic>? ?? const {},
          ),
        };
      case 'date':
        return {
          'kind': 'date',
          'value': answer?['value']?.toString() ?? '',
          'meta': Map<String, dynamic>.from(
            answer?['meta'] as Map<String, dynamic>? ?? const {},
          ),
        };
      case 'text':
        return {
          'kind': 'text',
          'value': answer?['value']?.toString() ?? '',
          'meta': Map<String, dynamic>.from(
            answer?['meta'] as Map<String, dynamic>? ?? const {},
          ),
        };
      case 'birth_date_object':
        final value = Map<String, dynamic>.from(
          answer?['value'] as Map<String, dynamic>? ?? const {},
        );
        final yearMonth = value['yearMonth']?.toString() ?? '';
        final parts = yearMonth.split('-');
        return {
          'kind': 'birth_date_object',
          'mode': value['mode']?.toString() ?? 'exact_date',
          'exactDate': value['exactDate']?.toString() ?? todayYmd(),
          'year': parts.isNotEmpty && parts.first.isNotEmpty
              ? parts.first
              : '${DateTime.now().year}',
          'month': parts.length > 1 ? parts[1] : '01',
        };
      default:
        return {'kind': 'single', 'value': null};
    }
  }

  Map<String, dynamic>? _toPayload(String id, Map<String, dynamic> draft) {
    final def = questionDef(id);
    switch (def['type']) {
      case 'single':
        final value = draft['value']?.toString();
        if (value == null || value.isEmpty) return null;
        return {'type': 'single', 'value': value};
      case 'multi':
        final values = List<String>.from(
          draft['values'] as List<dynamic>? ?? const [],
        );
        return {'type': 'multi', 'values': values};
      case 'number':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        if (meta['unknown'] == true || meta['no_answer'] == true) {
          return {'type': 'number', 'value': null, 'meta': meta};
        }
        final value = num.tryParse(draft['value']?.toString() ?? '');
        if (value == null) return null;
        return {'type': 'number', 'value': value, 'meta': {}};
      case 'date':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        if (meta['unknown'] == true || meta['no_answer'] == true) {
          return {'type': 'date', 'value': null, 'meta': meta};
        }
        final value = draft['value']?.toString();
        if (value == null || value.isEmpty) return null;
        return {'type': 'date', 'value': value, 'meta': {}};
      case 'text':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        if (meta['unknown'] == true || meta['no_answer'] == true) {
          return {'type': 'text', 'value': null, 'meta': meta};
        }
        final value = draft['value']?.toString();
        if ((def['required'] == true) &&
            (value == null || value.trim().isEmpty)) {
          return null;
        }
        return {
          'type': 'text',
          'value': value?.trim().isEmpty == true ? null : value?.trim(),
          'meta': {},
        };
      case 'birth_date_object':
        final mode = draft['mode']?.toString() ?? 'exact_date';
        if (mode == 'unknown') {
          return {
            'type': 'object',
            'value': {'mode': 'unknown'},
          };
        }
        if (mode == 'no_answer') {
          return {
            'type': 'object',
            'value': {'mode': 'no_answer'},
          };
        }
        if (mode == 'year_month') {
          return {
            'type': 'object',
            'value': {
              'mode': 'year_month',
              'yearMonth': '${draft['year']}-${draft['month']}',
            },
          };
        }
        return {
          'type': 'object',
          'value': {'mode': 'exact_date', 'exactDate': draft['exactDate']},
        };
      default:
        return null;
    }
  }

  Future<void> _submitCurrent() async {
    final currentId = _currentId;
    final draft = _draft;
    if (currentId == null || draft == null) return;
    final payload = _toPayload(currentId, draft);
    if (payload == null) return;
    setState(() => _submitting = true);
    try {
      final result = await ref
          .read(onboardingApiProvider)
          .answer(questionId: currentId, answer: payload);
      final nextAnswers = {..._answers, currentId: payload};
      setState(() {
        _answers = nextAnswers;
        _currentId = result.nextQuestionId;
        _draft = result.nextQuestionId == null
            ? null
            : _initDraft(result.nextQuestionId!, nextAnswers);
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _goPrev() async {
    final currentId = _currentId;
    if (currentId == null) return;
    final visible = getVisibleQuestionIds(_answers);
    final idx = visible.indexOf(currentId);
    if (idx <= 0) return;
    final prevId = visible[idx - 1];
    setState(() => _submitting = true);
    try {
      final result = await ref.read(onboardingApiProvider).position(prevId);
      final nextId = result.currentQuestionId ?? prevId;
      setState(() {
        _currentId = nextId;
        _draft = _initDraft(nextId, _answers);
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _skipCurrent() async {
    final currentId = _currentId;
    if (currentId == null) return;
    final nextId = getNextVisibleQuestionId(currentId, _answers);
    setState(() => _submitting = true);
    try {
      final result = await ref.read(onboardingApiProvider).position(nextId);
      final actualId = result.currentQuestionId ?? nextId;
      setState(() {
        _currentId = actualId;
        _draft = actualId == null ? null : _initDraft(actualId, _answers);
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _finalize() async {
    setState(() => _submitting = true);
    try {
      final ok = await ref.read(onboardingApiProvider).submit();
      if (!ok) return;
      final storage = await ref.read(appStorageProvider.future);
      await storage.setString(
        AppKeys.onboardingAnchorDate,
        _computeAnchorDate(_answers),
      );
      await ref
          .read(sessionControllerProvider.notifier)
          .markOnboardingCompleted();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _computeAnchorDate(Map<String, dynamic> answers) {
    final answer = answers['D5_last_period_start'] as Map<String, dynamic>?;
    final value = answer != null && answer['type'] == 'date'
        ? answer['value']?.toString()
        : null;
    final today = todayYmd();
    final min = addDaysYmd(today, -180);
    return clampYmd(
      (value != null && value.isNotEmpty) ? value : today,
      min,
      today,
    );
  }

  String _formatAnswer(String id) {
    final answer = _answers[id] as Map<String, dynamic>?;
    if (answer == null) return '未填写';
    final type = answer['type'];
    if (type == 'single') {
      final value = answer['value']?.toString();
      final option = questionOptions(id).firstWhere(
        (item) => item['value'] == value,
        orElse: () => <String, dynamic>{},
      );
      return option['label']?.toString() ?? value ?? '未填写';
    }
    if (type == 'multi') {
      final values = List<String>.from(
        answer['values'] as List<dynamic>? ?? const [],
      );
      final labels = values
          .map(
            (value) => questionOptions(id).firstWhere(
              (item) => item['value'] == value,
              orElse: () => {'label': value},
            )['label'],
          )
          .join('、');
      return labels.isEmpty ? '未填写' : labels;
    }
    if (type == 'object') {
      final value = Map<String, dynamic>.from(
        answer['value'] as Map<String, dynamic>? ?? const {},
      );
      switch (value['mode']) {
        case 'unknown':
          return '不确定/记不清';
        case 'no_answer':
          return '不愿透露';
        case 'year_month':
          return value['yearMonth']?.toString() ?? '未填写';
        default:
          return value['exactDate']?.toString() ?? '未填写';
      }
    }
    if ((answer['meta'] as Map<String, dynamic>? ?? const {})['unknown'] ==
        true) {
      return '不确定/记不清';
    }
    if ((answer['meta'] as Map<String, dynamic>? ?? const {})['no_answer'] ==
        true) {
      return '不愿透露';
    }
    return answer['value']?.toString() ?? '未填写';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_currentId == null) {
      final visibleIds = getVisibleQuestionIds(_answers)
          .where(
            (id) => questionDef(id)['required'] == true || _answers[id] != null,
          )
          .toList();
      return Scaffold(
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                l10n.onboardingTitle,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text('提交前确认', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      for (final id in visibleIds) ...[
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            questionDef(id)['title']?.toString() ?? id,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(_formatAnswer(id)),
                        ),
                        const Divider(height: 24),
                      ],
                      FilledButton(
                        onPressed: _submitting ? null : _finalize,
                        child: Text('提交并开始记录'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final def = questionDef(_currentId!);
    final visible = getVisibleQuestionIds(_answers);
    final idx = visible.indexOf(_currentId!);
    final ratio = visible.isEmpty
        ? 0.0
        : (idx < 0 ? 0.0 : idx / visible.length);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              l10n.onboardingTitle,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: ratio),
            const SizedBox(height: 8),
            Text('已完成 ${idx < 0 ? 0 : idx}/${visible.length}'),
            const SizedBox(height: 18),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      def['title']?.toString() ?? '',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (def['note'] != null) ...[
                      const SizedBox(height: 8),
                      Text(def['note'].toString()),
                    ],
                    const SizedBox(height: 16),
                    _QuestionEditor(
                      questionId: _currentId!,
                      def: def,
                      draft: _draft!,
                      search: _search,
                      onSearchChanged: (value) =>
                          setState(() => _search = value),
                      onChanged: (next) => setState(() => _draft = next),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        OutlinedButton(
                          onPressed: _submitting || idx <= 0 ? null : _goPrev,
                          child: const Text('上一题'),
                        ),
                        const SizedBox(width: 12),
                        OutlinedButton(
                          onPressed: _submitting ? null : _skipCurrent,
                          child: const Text('跳过'),
                        ),
                        const Spacer(),
                        FilledButton(
                          onPressed: _submitting ? null : _submitCurrent,
                          child: const Text('下一题'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestionEditor extends StatelessWidget {
  const _QuestionEditor({
    required this.questionId,
    required this.def,
    required this.draft,
    required this.search,
    required this.onSearchChanged,
    required this.onChanged,
  });

  final String questionId;
  final Map<String, dynamic> def;
  final Map<String, dynamic> draft;
  final String search;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<Map<String, dynamic>> onChanged;

  bool get _isTaggy =>
      questionId == 'F1_health_conditions' ||
      questionId == 'G1_bleeding_history_multi';

  bool _isExclusive(String value) {
    return value == 'none' ||
        value == '都没有' ||
        value == 'unknown' ||
        value == '不确定' ||
        value == 'no_answer';
  }

  @override
  Widget build(BuildContext context) {
    switch (def['type']) {
      case 'single':
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final option in questionOptions(questionId))
              ChoiceChip(
                label: Text(option['label'].toString()),
                selected: draft['value'] == option['value'],
                onSelected: (_) =>
                    onChanged({...draft, 'value': option['value']}),
              ),
          ],
        );
      case 'multi':
        final options = questionOptions(questionId)
            .where(
              (option) =>
                  search.trim().isEmpty ||
                  option['label'].toString().contains(search.trim()),
            )
            .toList();
        final values = List<String>.from(
          draft['values'] as List<dynamic>? ?? const [],
        );
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_isTaggy)
              TextField(
                decoration: const InputDecoration(hintText: '搜索并选择'),
                onChanged: onSearchChanged,
              ),
            if (_isTaggy) const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final option in options)
                  FilterChip(
                    label: Text(option['label'].toString()),
                    selected: values.contains(option['value']),
                    onSelected: (_) {
                      final next = [...values];
                      final value = option['value'].toString();
                      if (_isExclusive(value)) {
                        onChanged({
                          ...draft,
                          'values': [value],
                        });
                        return;
                      }
                      next.removeWhere(_isExclusive);
                      if (next.contains(value)) {
                        next.remove(value);
                      } else {
                        final max = def['maxSelections'] as num?;
                        if (max != null && next.length >= max.toInt()) return;
                        next.add(value);
                      }
                      onChanged({...draft, 'values': next});
                    },
                  ),
              ],
            ),
          ],
        );
      case 'number':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SyncedTextField(
              syncKey: '$questionId:number',
              value: draft['value']?.toString() ?? '',
              keyboardType: TextInputType.number,
              enabled: !(meta['unknown'] == true || meta['no_answer'] == true),
              onChanged: (value) =>
                  onChanged({...draft, 'value': value, 'meta': {}}),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if (def['allowUnknown'] == true)
                  ChoiceChip(
                    label: const Text('不确定'),
                    selected: meta['unknown'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'unknown': true},
                    }),
                  ),
                if (def['allowNoAnswer'] == true)
                  ChoiceChip(
                    label: const Text('不愿透露'),
                    selected: meta['no_answer'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'no_answer': true},
                    }),
                  ),
              ],
            ),
          ],
        );
      case 'date':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            OutlinedButton(
              onPressed: () async {
                final selected = await showDatePicker(
                  context: context,
                  initialDate: parseYmd(
                    (draft['value']?.toString().isNotEmpty == true)
                        ? draft['value'].toString()
                        : todayYmd(),
                  ),
                  firstDate: DateTime(1900),
                  lastDate: DateTime.now(),
                );
                if (selected == null) return;
                onChanged({
                  ...draft,
                  'value': ymdFromDate(selected),
                  'meta': {},
                });
              },
              child: Text(
                draft['value']?.toString().isNotEmpty == true
                    ? draft['value'].toString()
                    : '选择日期',
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if (def['allowUnknown'] == true)
                  ChoiceChip(
                    label: const Text('不确定'),
                    selected: meta['unknown'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'unknown': true},
                    }),
                  ),
                if (def['allowNoAnswer'] == true)
                  ChoiceChip(
                    label: const Text('不愿透露'),
                    selected: meta['no_answer'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'no_answer': true},
                    }),
                  ),
              ],
            ),
          ],
        );
      case 'text':
        final meta = Map<String, dynamic>.from(
          draft['meta'] as Map<String, dynamic>? ?? const {},
        );
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SyncedTextField(
              syncKey: '$questionId:text',
              value: draft['value']?.toString() ?? '',
              enabled: !(meta['unknown'] == true || meta['no_answer'] == true),
              onChanged: (value) =>
                  onChanged({...draft, 'value': value, 'meta': {}}),
              decoration: InputDecoration(
                hintText: def['placeholder']?.toString(),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if (def['allowUnknown'] == true)
                  ChoiceChip(
                    label: const Text('不确定'),
                    selected: meta['unknown'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'unknown': true},
                    }),
                  ),
                if (def['allowNoAnswer'] == true)
                  ChoiceChip(
                    label: const Text('不愿透露'),
                    selected: meta['no_answer'] == true,
                    onSelected: (_) => onChanged({
                      ...draft,
                      'meta': {'no_answer': true},
                    }),
                  ),
              ],
            ),
          ],
        );
      case 'birth_date_object':
        final mode = draft['mode']?.toString() ?? 'exact_date';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('具体日期'),
                  selected: mode == 'exact_date',
                  onSelected: (_) =>
                      onChanged({...draft, 'mode': 'exact_date'}),
                ),
                ChoiceChip(
                  label: const Text('只记得年月'),
                  selected: mode == 'year_month',
                  onSelected: (_) =>
                      onChanged({...draft, 'mode': 'year_month'}),
                ),
                ChoiceChip(
                  label: const Text('不确定'),
                  selected: mode == 'unknown',
                  onSelected: (_) => onChanged({...draft, 'mode': 'unknown'}),
                ),
                ChoiceChip(
                  label: const Text('不愿透露'),
                  selected: mode == 'no_answer',
                  onSelected: (_) => onChanged({...draft, 'mode': 'no_answer'}),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (mode == 'exact_date')
              OutlinedButton(
                onPressed: () async {
                  final selected = await showDatePicker(
                    context: context,
                    initialDate: parseYmd(
                      draft['exactDate']?.toString() ?? todayYmd(),
                    ),
                    firstDate: DateTime(1900),
                    lastDate: DateTime.now(),
                  );
                  if (selected == null) return;
                  onChanged({...draft, 'exactDate': ymdFromDate(selected)});
                },
                child: Text(draft['exactDate']?.toString() ?? '选择日期'),
              ),
            if (mode == 'year_month')
              Row(
                children: [
                  Expanded(
                    child: _SyncedTextField(
                      syncKey: '$questionId:year',
                      value: draft['year']?.toString() ?? '',
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: '年'),
                      onChanged: (value) =>
                          onChanged({...draft, 'year': value}),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SyncedTextField(
                      syncKey: '$questionId:month',
                      value: draft['month']?.toString() ?? '',
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: '月'),
                      onChanged: (value) =>
                          onChanged({...draft, 'month': value.padLeft(2, '0')}),
                    ),
                  ),
                ],
              ),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _SyncedTextField extends StatefulWidget {
  const _SyncedTextField({
    required this.syncKey,
    required this.value,
    required this.onChanged,
    this.keyboardType,
    this.enabled = true,
    this.decoration,
  });

  final String syncKey;
  final String value;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;
  final bool enabled;
  final InputDecoration? decoration;

  @override
  State<_SyncedTextField> createState() => _SyncedTextFieldState();
}

class _SyncedTextFieldState extends State<_SyncedTextField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(covariant _SyncedTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.syncKey != widget.syncKey ||
        _controller.text != widget.value) {
      _controller.value = TextEditingValue(
        text: widget.value,
        selection: TextSelection.collapsed(offset: widget.value.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: widget.keyboardType,
      enabled: widget.enabled,
      decoration: widget.decoration,
      onChanged: widget.onChanged,
    );
  }
}
