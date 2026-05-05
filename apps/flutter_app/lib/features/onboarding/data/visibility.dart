import 'question_bank.dart';

String? _single(Map<String, dynamic> answers, String id) {
  final answer = answers[id] as Map<String, dynamic>?;
  if (answer == null || answer['type'] != 'single') return null;
  return answer['value']?.toString();
}

List<String> _multi(Map<String, dynamic> answers, String id) {
  final answer = answers[id] as Map<String, dynamic>?;
  if (answer == null || answer['type'] != 'multi') return const [];
  return List<String>.from(answer['values'] as List<dynamic>? ?? const []);
}

bool _includesMulti(Map<String, dynamic> answers, String id, String value) {
  return _multi(answers, id).contains(value);
}

bool isQuestionVisible(String id, Map<String, dynamic> answers) {
  final menarcheEver = _single(answers, 'C1_menarche_ever');
  final mensesLast3m = _single(answers, 'C3_menses_last_3m');
  final currentStatus = _single(answers, 'C2_current_status');

  switch (id) {
    case 'A0_consent_research':
    case 'B1_birth_date':
    case 'B2_region_level':
    case 'C1_menarche_ever':
    case 'F1_health_conditions':
    case 'G1_bleeding_history_multi':
    case 'I1_height_cm':
    case 'I2_weight_kg':
      return true;
    case 'C6_menarche_age_band':
    case 'C3_menses_last_3m':
    case 'C2_current_status':
    case 'H1_contraception_methods':
    case 'H2_pregnancy_history':
      return menarcheEver == 'yes';
    case 'H5_abortion_history':
      final pregnancyHistory = _single(answers, 'H2_pregnancy_history');
      return menarcheEver == 'yes' && (pregnancyHistory == 'ever' || pregnancyHistory == 'pregnant_now');
    case 'C5_amenorrhea_reason':
      return menarcheEver == 'yes' && mensesLast3m == 'no';
    case 'C4_amenorrhea_ever_3m':
      if (!(menarcheEver == 'yes' && mensesLast3m == 'no')) return false;
      final reason = _single(answers, 'C5_amenorrhea_reason');
      return {'surgery', 'disease', 'weight_stress', 'other_known', 'unknown'}.contains(reason);
    case 'D1_period_length_days':
    case 'D2_cycle_regularity':
      return menarcheEver == 'yes' && mensesLast3m == 'yes' && currentStatus != 'menopause';
    case 'D3_cycle_length_days':
      return _single(answers, 'D2_cycle_regularity') == 'regular';
    case 'D4_irregular_patterns':
      return _single(answers, 'D2_cycle_regularity') == 'irregular';
    case 'D5_last_period_start':
      return menarcheEver == 'yes' && mensesLast3m == 'yes';
    case 'E1_products':
    case 'E2_change_frequency_peak':
    case 'E3_clots_leakage':
      return menarcheEver == 'yes' && currentStatus != 'menopause';
    case 'E1_pad_brand':
      return _includesMulti(answers, 'E1_products', 'pad');
    case 'E1_pad_brand_other_text':
      return _includesMulti(answers, 'E1_pad_brand', 'other');
    case 'E1_tampon_brand':
      return _includesMulti(answers, 'E1_products', 'tampon');
    case 'E1_tampon_brand_other_text':
      return _includesMulti(answers, 'E1_tampon_brand', 'other');
    case 'E1_cup_brand':
      return _includesMulti(answers, 'E1_products', 'cup');
    case 'E1_cup_brand_other_text':
      return _includesMulti(answers, 'E1_cup_brand', 'other');
    case 'E1_disc_brand':
      return _includesMulti(answers, 'E1_products', 'disc');
    case 'E1_disc_brand_other_text':
      return _includesMulti(answers, 'E1_disc_brand', 'other');
    case 'E1_period_underwear_brand':
      return _includesMulti(answers, 'E1_products', 'period_underwear');
    case 'E1_period_underwear_brand_other_text':
      return _includesMulti(answers, 'E1_period_underwear_brand', 'other');
    case 'E1_other_product_text':
      return _includesMulti(answers, 'E1_products', 'other');
    case 'F2_condition_source':
      return _multi(answers, 'F1_health_conditions').isNotEmpty;
    case 'F2_condition_source_unknown_text':
      return _single(answers, 'F2_condition_source') == 'unknown';
    case 'M1_pregnancy_possible':
      if (!(menarcheEver == 'yes' && currentStatus != 'menopause')) return false;
      return mensesLast3m == 'no' || _includesMulti(answers, 'F1_health_conditions', '非经期出血');
    case 'M1_pregnancy_test':
      final value = _single(answers, 'M1_pregnancy_possible');
      return value == 'possible' || value == 'unknown';
    case 'M2_iron_deficiency_confirm':
      return _includesMulti(answers, 'F1_health_conditions', '缺铁性贫血');
    case 'M3_iron_treatment':
      return _single(answers, 'M2_iron_deficiency_confirm') == 'yes';
    case 'H3_pregnancy_count_band':
    case 'H4_birth_history':
      final value = _single(answers, 'H2_pregnancy_history');
      return value == 'ever' || value == 'pregnant_now';
    case 'J1_know_mbl':
      return menarcheEver == 'yes' && currentStatus != 'menopause';
    case 'J2_mbl_band':
      return _single(answers, 'J1_know_mbl') == 'yes';
    case 'J3_mbl_subjective':
      final value = _single(answers, 'J1_know_mbl');
      return value != null && value != 'yes';
    default:
      return false;
  }
}

List<String> getVisibleQuestionIds(Map<String, dynamic> answers) {
  return onboardingQuestionOrder.where((id) => isQuestionVisible(id, answers)).toList();
}

String? getNextVisibleQuestionId(String afterId, Map<String, dynamic> answers) {
  final idx = onboardingQuestionOrder.indexOf(afterId);
  if (idx < 0) return null;
  for (var i = idx + 1; i < onboardingQuestionOrder.length; i++) {
    final id = onboardingQuestionOrder[i];
    if (isQuestionVisible(id, answers)) return id;
  }
  return null;
}
