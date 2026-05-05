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
  final _emailFocusNode = FocusNode();
  final _codeFocusNode = FocusNode();
  bool _codeStep = false;
  int _cooldown = 0;
  Timer? _timer;
  String? _devCode;
  bool _autoSubmitting = false;
  bool _showEmailValidation = false;
  bool _showCodeValidation = false;

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _codeController.dispose();
    _emailFocusNode.dispose();
    _codeFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final busy = ref.watch(
      sessionControllerProvider.select((state) => state.isBusy),
    );
    final errorMessage = ref.watch(
      sessionControllerProvider.select((state) => state.errorMessage),
    );
    final email = _emailController.text.trim();
    final code = _codeController.text.trim();
    final emailError = _showEmailValidation && !_isEmail(email)
        ? l10n.invalidEmail
        : null;
    final codeError = _showCodeValidation && code.isNotEmpty && code.length != 6
        ? l10n.invalidCode
        : null;
    final canSubmit = _codeStep
        ? _isEmail(email) && code.length == 6
        : _isEmail(email);

    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF6E9E1), Color(0xFFF0DFD7), Color(0xFFE8DEE2)],
          ),
          boxShadow: [
            BoxShadow(
              color: Theme.of(
                context,
              ).colorScheme.primary.withValues(alpha: 0.04),
              blurRadius: 120,
              offset: const Offset(0, -20),
            ),
          ],
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.84),
                    borderRadius: BorderRadius.circular(34),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 32,
                        offset: const Offset(0, 18),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AutofillGroup(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(22),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Color(0xFF8E4151),
                                      Color(0xFF733340),
                                      Color(0xFF55262F),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(28),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'FLOWCYCLE',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.3,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      l10n.brandName,
                                      style: Theme.of(context)
                                          .textTheme
                                          .displaySmall
                                          ?.copyWith(color: Colors.white),
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      _codeStep
                                          ? '输入 6 位验证码，继续你的记录与分析。'
                                          : '邮箱验证码登录，继续引导，开始按日记录。',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyLarge
                                          ?.copyWith(
                                            color: Colors.white.withValues(
                                              alpha: 0.82,
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                _codeStep ? '验证邮箱' : '输入邮箱',
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.primary,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _emailController,
                                focusNode: _emailFocusNode,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: _codeStep
                                    ? TextInputAction.done
                                    : TextInputAction.next,
                                autofillHints: const [AutofillHints.email],
                                readOnly: _codeStep,
                                onChanged: (_) {
                                  if (_showEmailValidation) {
                                    setState(() {});
                                  }
                                },
                                onSubmitted: (_) {
                                  if (_codeStep) return;
                                  if (_isEmail(_emailController.text.trim())) {
                                    _handlePrimaryAction();
                                  } else {
                                    setState(() => _showEmailValidation = true);
                                  }
                                },
                                decoration: InputDecoration(
                                  labelText: l10n.email,
                                  hintText: l10n.emailPlaceholder,
                                  errorText: emailError,
                                  helperText: _codeStep
                                      ? '验证码已发送到该邮箱'
                                      : l10n.marketingHint,
                                  suffixIcon: _codeStep
                                      ? TextButton(
                                          onPressed: busy
                                              ? null
                                              : () {
                                                  setState(() {
                                                    _codeStep = false;
                                                    _codeController.clear();
                                                    _devCode = null;
                                                    _cooldown = 0;
                                                    _showCodeValidation = false;
                                                  });
                                                  _timer?.cancel();
                                                  _emailFocusNode
                                                      .requestFocus();
                                                },
                                          child: const Text('修改'),
                                        )
                                      : (_emailController.text.isEmpty
                                            ? null
                                            : IconButton(
                                                onPressed: busy
                                                    ? null
                                                    : () {
                                                        _emailController
                                                            .clear();
                                                        setState(() {});
                                                        _emailFocusNode
                                                            .requestFocus();
                                                      },
                                                icon: const Icon(Icons.close),
                                                tooltip: '清空邮箱',
                                              )),
                                ),
                              ),
                              if (_codeStep) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8F1EC),
                                    borderRadius: BorderRadius.circular(24),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '输入验证码',
                                        style: Theme.of(
                                          context,
                                        ).textTheme.titleMedium,
                                      ),
                                      const SizedBox(height: 10),
                                      TextField(
                                        controller: _codeController,
                                        focusNode: _codeFocusNode,
                                        keyboardType: TextInputType.number,
                                        textInputAction: TextInputAction.done,
                                        autofillHints: [
                                          AutofillHints.oneTimeCode,
                                        ],
                                        inputFormatters: [
                                          FilteringTextInputFormatter
                                              .digitsOnly,
                                          LengthLimitingTextInputFormatter(6),
                                        ],
                                        autofocus: true,
                                        onChanged: (value) {
                                          if (_showCodeValidation) {
                                            setState(() {});
                                          }
                                          _onCodeChanged(value, busy);
                                        },
                                        onSubmitted: (_) =>
                                            _handlePrimaryAction(),
                                        decoration: InputDecoration(
                                          labelText: '验证码',
                                          hintText: '输入 6 位数字',
                                          errorText: codeError,
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
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (errorMessage != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Theme.of(
                                context,
                              ).colorScheme.errorContainer,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(
                              errorMessage,
                              style: TextStyle(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onErrorContainer,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                        if (_devCode != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF6EFEA),
                              borderRadius: BorderRadius.circular(22),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '开发环境验证码',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _devCode!,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.headlineMedium,
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
                          onPressed: busy || !canSubmit
                              ? null
                              : _handlePrimaryAction,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(56),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              if (busy) ...[
                                const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Text(
                                _codeStep ? l10n.verifyAndLogin : l10n.sendCode,
                              ),
                            ],
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
      setState(() => _showEmailValidation = true);
      _emailFocusNode.requestFocus();
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
          _showEmailValidation = false;
          _showCodeValidation = false;
        });
        _startCooldown();
        _codeFocusNode.requestFocus();
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
    final email = _emailController.text.trim();
    if (!_isEmail(email)) {
      if (showValidationError) {
        setState(() => _showEmailValidation = true);
        _emailFocusNode.requestFocus();
      }
      return;
    }
    if (code.length != 6) {
      if (showValidationError) {
        setState(() => _showCodeValidation = true);
        _codeFocusNode.requestFocus();
      }
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
