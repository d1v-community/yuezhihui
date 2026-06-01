import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';
import '../../../l10n/app_localizations.dart';

class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key});

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  int _typeIndex = 0;
  final _contentController = TextEditingController();
  final _contactController = TextEditingController();
  bool _submitting = false;
  bool _restoredDraft = false;
  DateTime? _draftSavedAt;

  @override
  void initState() {
    super.initState();
    Future.microtask(_restoreDraft);
  }

  Future<void> _restoreDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    final json = storage.getJsonMap(AppKeys.feedbackDraft);
    if (json == null) return;
    if (!mounted) return;
    setState(() {
      _typeIndex = (json['typeIndex'] as num?)?.toInt() ?? 0;
      _contentController.text = json['content']?.toString() ?? '';
      _contactController.text = json['contact']?.toString() ?? '';
      _restoredDraft = true;
      _draftSavedAt = _readDateTime(json['savedAt']?.toString());
    });
  }

  Future<void> _saveDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    final savedAt = DateTime.now();
    await storage.setJsonMap(AppKeys.feedbackDraft, {
      'typeIndex': _typeIndex,
      'content': _contentController.text,
      'contact': _contactController.text,
      'savedAt': savedAt.toIso8601String(),
    });
    if (!mounted) return;
    setState(() => _draftSavedAt = savedAt);
  }

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _submitting = true);
    try {
      await ref
          .read(feedbackApiProvider)
          .submit(
            typeIndex: _typeIndex,
            content: _contentController.text.trim(),
            contact: _contactController.text.trim(),
          );
      final storage = await ref.read(appStorageProvider.future);
      await storage.remove(AppKeys.feedbackDraft);
      if (!mounted) return;
      setState(() {
        _typeIndex = 0;
        _contentController.clear();
        _contactController.clear();
        _restoredDraft = false;
        _draftSavedAt = null;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_l10n.feedbackSubmitted)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  bool get _canSubmit => _contentController.text.trim().length >= 5;

  AppLocalizations get _l10n => AppLocalizations.of(context)!;

  List<String> get _types => [
    _l10n.feedbackBug,
    _l10n.feedbackExperience,
    _l10n.feedbackFeature,
    _l10n.feedbackContent,
    _l10n.feedbackOther,
  ];

  String get _draftStatusText {
    if (_draftSavedAt == null) {
      return _restoredDraft
          ? _l10n.feedbackDraftRestored
          : _l10n.feedbackDraftHint;
    }
    return _l10n.feedbackDraftSaved(_formatTime(_draftSavedAt!));
  }

  String _formatTime(DateTime value) {
    final hh = value.hour.toString().padLeft(2, '0');
    final mm = value.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  DateTime? _readDateTime(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    return DateTime.tryParse(raw);
  }

  @override
  void dispose() {
    _contentController.dispose();
    _contactController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contentLength = _contentController.text.trim().length;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.feedbackTitle)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.feedbackType,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (var i = 0; i < _types.length; i++)
                        ChoiceChip(
                          label: Text(_types[i]),
                          selected: _typeIndex == i,
                          onSelected: (_) {
                            setState(() => _typeIndex = i);
                            _saveDraft();
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F1EC),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      _draftStatusText,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _contentController,
                    minLines: 5,
                    maxLines: 6,
                    textInputAction: TextInputAction.newline,
                    onChanged: (_) {
                      setState(() {});
                      _saveDraft();
                    },
                    decoration: InputDecoration(
                      labelText: l10n.feedbackDescription,
                      hintText: l10n.feedbackDescriptionHint,
                      helperText: contentLength >= 5
                          ? l10n.feedbackSpecificHint
                          : l10n.feedbackMinimumHint,
                      counterText: '$contentLength / 5+',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _contactController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => _saveDraft(),
                    decoration: InputDecoration(
                      labelText: l10n.feedbackContact,
                      hintText: l10n.feedbackContactHint,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _submitting || !_canSubmit ? null : _submit,
                    child: Text(
                      _submitting ? l10n.submitting : l10n.submitFeedback,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
