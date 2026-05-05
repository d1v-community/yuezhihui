import 'package:flutter/material.dart';
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

  @override
  void dispose() {
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
                        Text(l10n.brandName, style: Theme.of(context).textTheme.displaySmall),
                        const SizedBox(height: 12),
                        Text(l10n.brandTagline, style: Theme.of(context).textTheme.bodyLarge),
                        const SizedBox(height: 24),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            labelText: l10n.email,
                            hintText: l10n.emailPlaceholder,
                            helperText: _codeStep ? l10n.codeSentHint : l10n.marketingHint,
                          ),
                        ),
                        if (_codeStep) ...[
                          const SizedBox(height: 16),
                          TextField(
                            controller: _codeController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            decoration: InputDecoration(
                              labelText: l10n.verificationCode,
                            ),
                          ),
                        ],
                        if (session.errorMessage != null) ...[
                          const SizedBox(height: 10),
                          Text(
                            session.errorMessage!,
                            style: TextStyle(color: Theme.of(context).colorScheme.error),
                          ),
                        ],
                        const SizedBox(height: 24),
                        FilledButton(
                          onPressed: busy ? null : _handlePrimaryAction,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size.fromHeight(54),
                          ),
                          child: Text(_codeStep ? l10n.verifyAndLogin : l10n.sendCode),
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
        await ref.read(sessionControllerProvider.notifier).sendCode(email);
        if (!mounted) return;
        setState(() => _codeStep = true);
        _showSnack(l10n.codeSentHint);
      } catch (_) {}
      return;
    }

    final code = _codeController.text.trim();
    if (code.length != 6) {
      _showSnack(l10n.invalidCode);
      return;
    }
    try {
      await ref.read(sessionControllerProvider.notifier).verifyLogin(email, code);
    } catch (_) {}
  }

  bool _isEmail(String email) {
    final pattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    return pattern.hasMatch(email);
  }

  void _showSnack(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }
}
