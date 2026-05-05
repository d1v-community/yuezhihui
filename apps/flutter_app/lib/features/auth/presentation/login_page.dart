import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/session/session_controller.dart';
import '../../../l10n/app_localizations.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  bool _codeStep = false;
  int _cooldown = 0;
  Timer? _timer;
  String? _devCode;
  bool _autoSubmitting = false;

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref.watch(sessionControllerProvider);
    final busy = session.isBusy;

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF7E7DF), Color(0xFFF3D8D8), Color(0xFFE4D5E6)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.brandName,
                          style: Theme.of(context).textTheme.displaySmall,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '邮箱验证码登录，继续引导，开始按日记录。',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 24),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          readOnly: _codeStep,
                          decoration: InputDecoration(
                            labelText: l10n.email,
                            hintText: l10n.emailPlaceholder,
                            helperText: _codeStep
                                ? '验证码已发送到该邮箱'
                                : l10n.marketingHint,
                            suffix: _codeStep
                                ? TextButton(
                                    onPressed: busy
                                        ? null
                                        : () {
                                            setState(() {
                                              _codeStep = false;
                                              _codeController.clear();
                                              _devCode = null;
                                              _cooldown = 0;
                                            });
                                            _timer?.cancel();
                                          },
                                    child: const Text('修改'),
                                  )
                                : null,
                          ),
                        ),
                        if (_codeStep) ...[
                          const SizedBox(height: 16),
                          TextField(
                            controller: _codeController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            autofocus: true,
                            onChanged: (value) => _onCodeChanged(value, busy),
                            decoration: InputDecoration(
                              labelText: '验证码',
                              suffixIcon: IconButton(
                                onPressed: busy
                                    ? null
                                    : _pasteCodeFromClipboard,
                                icon: const Icon(
                                  Icons.content_paste_go_outlined,
                                ),
                                tooltip: '粘贴验证码',
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                _cooldown > 0
                                    ? '重新发送（${_cooldown}s）'
                                    : '可重新发送验证码',
                              ),
                              const Spacer(),
                              TextButton(
                                onPressed: busy || _cooldown > 0
                                    ? null
                                    : _resendCode,
                                child: const Text('重新发送'),
                              ),
                            ],
                          ),
                        ],
                        if (session.errorMessage != null) ...[
                          const SizedBox(height: 10),
                          Text(
                            session.errorMessage!,
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ],
                        if (_devCode != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF6EFEA),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '开发环境验证码',
                                  style: TextStyle(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _devCode!,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.headlineSmall,
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    OutlinedButton(
                                      onPressed: () async {
                                        await Clipboard.setData(
                                          ClipboardData(text: _devCode!),
                                        );
                                        _showSnack('验证码已复制');
                                      },
                                      child: const Text('复制验证码'),
                                    ),
                                    FilledButton.tonal(
                                      onPressed: () {
                                        _codeController.text = _devCode!;
                                        _onCodeChanged(_devCode!, busy);
                                      },
                                      child: const Text('填入并登录'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: busy ? null : _handlePrimaryAction,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(54),
                          ),
                          child: Text(
                            _codeStep ? l10n.verifyAndLogin : l10n.sendCode,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handlePrimaryAction() async {
    final l10n = AppLocalizations.of(context)!;
    final email = _emailController.text.trim();
    if (!_isEmail(email)) {
      _showSnack(l10n.invalidEmail);
      return;
    }
    if (!_codeStep) {
      try {
        final result = await ref
            .read(sessionControllerProvider.notifier)
            .sendCode(email);
        if (!mounted) return;
        setState(() {
          _codeStep = true;
          _devCode = result.devMode ? result.code : null;
        });
        _startCooldown();
        _showSnack(l10n.codeSentHint);
      } catch (_) {}
      return;
    }

    final code = _codeController.text.trim();
    await _submitCode(code, showValidationError: true);
  }

  Future<void> _resendCode() async {
    final email = _emailController.text.trim();
    if (!_isEmail(email)) return;
    try {
      final result = await ref
          .read(sessionControllerProvider.notifier)
          .sendCode(email);
      if (!mounted) return;
      setState(() => _devCode = result.devMode ? result.code : null);
      _startCooldown();
      _showSnack('验证码已重新发送');
    } catch (_) {}
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _cooldown <= 1) {
        timer.cancel();
        if (mounted) setState(() => _cooldown = 0);
        return;
      }
      setState(() => _cooldown -= 1);
    });
  }

  bool _isEmail(String email) {
    final pattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    return pattern.hasMatch(email);
  }

  Future<void> _submitCode(
    String code, {
    bool showValidationError = false,
  }) async {
    final l10n = AppLocalizations.of(context)!;
    final email = _emailController.text.trim();
    if (!_isEmail(email)) {
      if (showValidationError) _showSnack(l10n.invalidEmail);
      return;
    }
    if (code.length != 6) {
      if (showValidationError) _showSnack(l10n.invalidCode);
      return;
    }
    try {
      await ref
          .read(sessionControllerProvider.notifier)
          .verifyLogin(email, code);
    } catch (_) {}
  }

  Future<void> _pasteCodeFromClipboard() async {
    final data = await Clipboard.getData('text/plain');
    final raw = data?.text ?? '';
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 6) {
      _showSnack('剪贴板里没有 6 位验证码');
      return;
    }
    final code = digits.substring(0, 6);
    _codeController.text = code;
    await _submitCode(code, showValidationError: false);
  }

  Future<void> _onCodeChanged(String value, bool busy) async {
    if (busy || _autoSubmitting) return;
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits != value) {
      _codeController.value = TextEditingValue(
        text: digits,
        selection: TextSelection.collapsed(offset: digits.length),
      );
    }
    if (digits.length != 6) return;
    _autoSubmitting = true;
    try {
      await _submitCode(digits, showValidationError: false);
    } finally {
      _autoSubmitting = false;
    }
  }

  void _showSnack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }
}
