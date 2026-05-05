import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../session/session_controller.dart';

class LocaleState {
  const LocaleState(this.locale);

  final Locale? locale;
}

final localeControllerProvider = NotifierProvider<LocaleController, LocaleState>(LocaleController.new);

class LocaleController extends Notifier<LocaleState> {
  @override
  LocaleState build() {
    Future.microtask(_restore);
    return const LocaleState(null);
  }

  Future<void> _restore() async {
    final storage = await ref.read(appStorageProvider.future);
    final localeCode = storage.getLocaleCode();
    if (localeCode == null || localeCode.isEmpty) {
      state = const LocaleState(null);
      return;
    }
    state = LocaleState(Locale(localeCode));
  }

  Future<void> setLocale(String? languageCode) async {
    final storage = await ref.read(appStorageProvider.future);
    await storage.setLocaleCode(languageCode);
    state = languageCode == null ? const LocaleState(null) : LocaleState(Locale(languageCode));
  }
}
