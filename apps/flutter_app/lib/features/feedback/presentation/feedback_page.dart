import 'dart:convert';

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

  @override
  void initState() {
    super.initState();
    Future.microtask(_restoreDraft);
  }

  Future<void> _restoreDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    final raw = storage.getString(AppKeys.feedbackDraft);
    if (raw == null || raw.isEmpty) return;
    final json = jsonDecode(raw) as Map<String, dynamic>;
    setState(() {
      _typeIndex = (json['typeIndex'] as num?)?.toInt() ?? 0;
      _contentController.text = json['content']?.toString() ?? '';
      _contactController.text = json['contact']?.toString() ?? '';
    });
  }

  Future<void> _saveDraft() async {
    final storage = await ref.read(appStorageProvider.future);
    await storage.setJson(
      AppKeys.feedbackDraft,
      jsonEncode({
        'typeIndex': _typeIndex,
        'content': _contentController.text,
        'contact': _contactController.text,
      }),
    );
  }

  Future<void> _submit() async {
    if (_contentController.text.trim().length < 5) return;
    setState(() => _submitting = true);
    try {
      await ref.read(feedbackApiProvider).submit(
            typeIndex: _typeIndex,
            content: _contentController.text.trim(),
            contact: _contactController.text.trim(),
          );
      final storage = await ref.read(appStorageProvider.future);
      await storage.remove(AppKeys.feedbackDraft);
      if (!mounted) return;
      _contentController.clear();
      _contactController.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('提交成功')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  TextField(
                    controller: _contentController,
                    maxLines: 6,
                    onChanged: (_) => _saveDraft(),
                    decoration: const InputDecoration(hintText: '请描述你做了什么、期望是什么、实际发生了什么'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _contactController,
                    onChanged: (_) => _saveDraft(),
                    decoration: const InputDecoration(hintText: '联系方式（可选）'),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _submitting ? null : _submit,
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
