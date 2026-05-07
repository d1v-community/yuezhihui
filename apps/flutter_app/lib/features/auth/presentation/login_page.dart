import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFFBF4EF), Color(0xFFF3E6DF), Color(0xFFECDDE0)],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned(
                top: -80,
                right: -40,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.92, end: 1),
                  duration: const Duration(seconds: 4),
                  curve: Curves.easeInOut,
                  builder: (context, value, child) =>
                      Transform.scale(scale: value, child: child),
                  child: const _AmbientGlow(
                    size: 240,
                    colors: [Color(0x30A04657), Color(0x00A04657)],
                  ),
                ),
              ),
              Positioned(
                left: -60,
                bottom: 120,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 1, end: 1.08),
                  duration: const Duration(seconds: 5),
                  curve: Curves.easeInOut,
                  builder: (context, value, child) =>
                      Transform.scale(scale: value, child: child),
                  child: const _AmbientGlow(
                    size: 220,
                    colors: [Color(0x26A04657), Color(0x00A04657)],
                  ),
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 24,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 320),
                      curve: Curves.easeOutCubic,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.82),
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.72),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(
                              alpha: _codeStep ? 0.08 : 0.06,
                            ),
                            blurRadius: _codeStep ? 46 : 40,
                            offset: Offset(0, _codeStep ? 24 : 20),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _LoginShowcase(codeStep: _codeStep),
                            const SizedBox(height: 24),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 240),
                              switchInCurve: Curves.easeOutCubic,
                              switchOutCurve: Curves.easeInCubic,
                              transitionBuilder: (child, animation) {
                                final offset = Tween<Offset>(
                                  begin: const Offset(0, 0.05),
                                  end: Offset.zero,
                                ).animate(animation);
                                return FadeTransition(
                                  opacity: animation,
                                  child: SlideTransition(
                                    position: offset,
                                    child: child,
                                  ),
                                );
                              },
                              child: KeyedSubtree(
                                key: ValueKey(_codeStep),
                                child: _buildForm(
                                  context,
                                  l10n,
                                  busy,
                                  errorMessage,
                                  emailError,
                                  codeError,
                                  canSubmit,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const Positioned(
                top: 56,
                right: 24,
                child: _AmbientGlow(
                  size: 180,
                  colors: [Color(0x30D9A79C), Color(0x00D9A79C)],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildForm(
    BuildContext context,
    AppLocalizations l10n,
    bool busy,
    String? errorMessage,
    String? emailError,
    String? codeError,
    bool canSubmit,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _codeStep ? '验证邮箱' : '输入邮箱',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
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
                onChanged: (_) => setState(() {}),
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
                  helperText: _codeStep ? null : l10n.marketingHint,
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
                                  _emailFocusNode.requestFocus();
                                },
                          child: const Text('修改'),
                        )
                      : (_emailController.text.isEmpty
                            ? null
                            : IconButton(
                                onPressed: busy
                                    ? null
                                    : () {
                                        _emailController.clear();
                                        setState(() {});
                                        _emailFocusNode.requestFocus();
                                      },
                                icon: const Icon(Icons.close),
                                tooltip: '清空邮箱',
                              )),
                ),
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutCubic,
                child: !_codeStep
                    ? const SizedBox.shrink()
                    : Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 320),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8F1EC),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Theme.of(
                                  context,
                                ).colorScheme.primary.withValues(alpha: 0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0.96, end: 1),
                            duration: const Duration(milliseconds: 280),
                            curve: Curves.easeOutBack,
                            builder: (context, value, child) => Transform.scale(
                              scale: value,
                              alignment: Alignment.topCenter,
                              child: Opacity(
                                opacity: value.clamp(0.0, 1.0),
                                child: child,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
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
                                  autofillHints: [AutofillHints.oneTimeCode],
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(6),
                                  ],
                                  autofocus: true,
                                  onChanged: (value) {
                                    if (_showCodeValidation) {
                                      setState(() {});
                                    }
                                    _onCodeChanged(value, busy);
                                  },
                                  onSubmitted: (_) => _handlePrimaryAction(),
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
                                          ? '${_cooldown}s 后可重发'
                                          : '可重新发送',
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
                        ),
                      ),
              ),
            ],
          ),
        ),
        if (errorMessage != null) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Text(
              errorMessage,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onErrorContainer,
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
                Text('开发环境验证码', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(
                  _devCode!,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () async {
                        await Clipboard.setData(ClipboardData(text: _devCode!));
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
          onPressed: busy || !canSubmit ? null : _handlePrimaryAction,
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
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
              Text(_codeStep ? l10n.verifyAndLogin : l10n.sendCode),
            ],
          ),
        ),
        if (!_codeStep) ...[
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: busy ? null : () => context.go('/encyclopedia'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
            child: const Text('浏览百科'),
          ),
        ],
      ],
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

class _LoginShowcase extends StatelessWidget {
  const _LoginShowcase({required this.codeStep});

  final bool codeStep;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.94, end: 1),
            duration: const Duration(milliseconds: 700),
            curve: Curves.easeOutBack,
            builder: (context, value, child) => Transform.scale(
              scale: value,
              child: Opacity(opacity: value.clamp(0.0, 1.0), child: child),
            ),
            child: Container(
              width: 94,
              height: 94,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFF7E8E2),
                    Color(0xFFE3C7C4),
                    Color(0xFFDAB8C0),
                  ],
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF8C3B4D).withValues(alpha: 0.16),
                    blurRadius: 26,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Image.asset(
                  'assets/branding/app_logo_master.png',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Center(
          child: Text(
            '月知会',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Center(
          child: Text(
            'FLOWSENSE',
            style: theme.textTheme.labelLarge?.copyWith(
              color: Theme.of(
                context,
              ).colorScheme.primary.withValues(alpha: 0.7),
              letterSpacing: 1.6,
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          codeStep ? '输入验证码' : '邮箱验证码登录',
          style: theme.textTheme.titleLarge?.copyWith(
            height: 1.2,
            fontWeight: FontWeight.w800,
          ),
        ),
        if (codeStep) ...[
          const SizedBox(height: 8),
          Text(
            '6 位数字验证码已发送到邮箱。',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.72),
            ),
          ),
        ],
        if (!codeStep) ...[
          const SizedBox(height: 18),
          _LoginProgress(codeStep: codeStep),
        ],
      ],
    );
  }
}

class _LoginProgress extends StatelessWidget {
  const _LoginProgress({required this.codeStep});

  final bool codeStep;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Row(
      children: [
        const Expanded(
          child: _ProgressPill(
            active: true,
            title: '邮箱',
            icon: Icons.alternate_email_rounded,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _ProgressPill(
            active: codeStep,
            title: '验证',
            icon: Icons.verified_user_rounded,
          ),
        ),
        const SizedBox(width: 10),
        AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          width: codeStep ? 28 : 16,
          height: 6,
          decoration: BoxDecoration(
            color: codeStep ? primary : primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      ],
    );
  }
}

class _ProgressPill extends StatelessWidget {
  const _ProgressPill({
    required this.active,
    required this.title,
    required this.icon,
  });

  final bool active;
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: active ? primary.withValues(alpha: 0.1) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: active
              ? primary.withValues(alpha: 0.18)
              : Theme.of(context).colorScheme.outlineVariant,
        ),
      ),
      child: Row(
        children: [
          AnimatedScale(
            scale: active ? 1 : 0.92,
            duration: const Duration(milliseconds: 240),
            child: Icon(
              icon,
              size: 18,
              color: active ? primary : primary.withValues(alpha: 0.45),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: active ? primary : primary.withValues(alpha: 0.56),
            ),
          ),
        ],
      ),
    );
  }
}

class _AmbientGlow extends StatelessWidget {
  const _AmbientGlow({required this.size, required this.colors});

  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: colors),
        ),
      ),
    );
  }
}
