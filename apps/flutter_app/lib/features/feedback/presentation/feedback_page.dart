import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/storage/app_keys.dart';

class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key});

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  static const types = ['功能异常', '体验问题', '新功能建议', '内容反馈', '其他'];

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
      ).showSnackBar(const SnackBar(content: Text('提交成功')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  bool get _canSubmit => _contentController.text.trim().length >= 5;

  String get _draftStatusText {
    if (_draftSavedAt == null) {
      return _restoredDraft ? '已恢复上次未提交内容' : '输入内容会自动保存为草稿';
    }
    return '草稿已保存 ${_formatTime(_draftSavedAt!)}';
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
    return Scaffold(
      appBar: AppBar(title: const Text('反馈')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('问题类型', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (var i = 0; i < types.length; i++)
                        ChoiceChip(
                          label: Text(types[i]),
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
                      labelText: '问题描述',
                      hintText: '请描述你做了什么、期望是什么、实际发生了什么',
                      helperText: contentLength >= 5
                          ? '信息越完整，越方便定位问题'
                          : '至少输入 5 个字，便于我们判断问题',
                      counterText: '$contentLength / 5+',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _contactController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => _saveDraft(),
                    decoration: const InputDecoration(
                      labelText: '联系方式（可选）',
                      hintText: '邮箱 / 微信 / 手机号',
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _submitting || !_canSubmit ? null : _submit,
                    child: Text(_submitting ? '提交中...' : '提交反馈'),
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
