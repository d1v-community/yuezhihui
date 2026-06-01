import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../l10n/app_localizations.dart';
import '../../shared/presentation/flow_page.dart';

class EncyclopediaPage extends StatefulWidget {
  const EncyclopediaPage({super.key, this.initialCardId});

  final String? initialCardId;

  @override
  State<EncyclopediaPage> createState() => _EncyclopediaPageState();
}

class _EncyclopediaPageState extends State<EncyclopediaPage> {
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    _expandedId = widget.initialCardId;
  }

  List<_KbCard> _cards(AppLocalizations l10n) => [
    _KbCard(
      id: 'vital-sign',
      tag: l10n.kbVitalTag,
      title: l10n.kbVitalTitle,
      lead: l10n.kbVitalLead,
      body: [l10n.kbVitalBody1, l10n.kbVitalBody2],
      bullets: [l10n.kbVitalBullet1, l10n.kbVitalBullet2, l10n.kbVitalBullet3],
      sources: [
        _Source(
          l10n.sourceAcogVital,
          'https://www.acog.org/womens-health/faqs/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign',
        ),
        _Source(
          l10n.sourceMayoCycle,
          'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cycle/art-20047186',
        ),
      ],
    ),
    _KbCard(
      id: 'normal-range',
      tag: l10n.kbNormalTag,
      title: l10n.kbNormalTitle,
      lead: l10n.kbNormalLead,
      body: [l10n.kbNormalBody],
      bullets: [
        l10n.kbNormalBullet1,
        l10n.kbNormalBullet2,
        l10n.kbNormalBullet3,
        l10n.kbNormalBullet4,
      ],
      sources: [
        _Source(
          l10n.sourceCdcHeavy,
          'https://www.cdc.gov/heavy-menstrual-bleeding/index.html',
        ),
      ],
    ),
    _KbCard(
      id: 'hmb',
      isRisk: true,
      tag: l10n.kbRiskTag,
      title: l10n.kbRiskTitle,
      lead: l10n.kbRiskLead,
      body: [l10n.kbRiskBody],
      bullets: [],
      redFlags: [
        l10n.kbRiskFlag1,
        l10n.kbRiskFlag2,
        l10n.kbRiskFlag3,
        l10n.kbRiskFlag4,
      ],
      sources: [
        _Source(
          l10n.sourceNhsHeavy,
          'https://www.nhs.uk/conditions/heavy-periods/',
        ),
        _Source(
          l10n.sourceMayoHeavy,
          'https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20351256',
        ),
      ],
    ),
    _KbCard(
      id: 'track',
      tag: l10n.kbTrackTag,
      title: l10n.kbTrackTitle,
      lead: l10n.kbTrackLead,
      body: [l10n.kbTrackBody],
      bullets: [
        l10n.kbTrackBullet1,
        l10n.kbTrackBullet2,
        l10n.kbTrackBullet3,
        l10n.kbTrackBullet4,
        l10n.kbTrackBullet5,
        l10n.kbTrackBullet6,
      ],
      sources: [
        _Source(
          l10n.sourceWhoEndometriosis,
          'https://www.who.int/news-room/fact-sheets/detail/endometriosis',
        ),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return FlowPage(
      title: l10n.encyclopediaTitle,
      subtitle: l10n.encyclopediaSubtitle,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFBF4EF), Color(0xFFF4E8E0), Color(0xFFEFE3E6)],
            ),
            borderRadius: BorderRadius.circular(34),
            border: Border.all(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.encyclopediaNote,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Color(0xFF8C3B4D),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                l10n.encyclopediaHeroTitle,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(l10n.encyclopediaHeroBody),
            ],
          ),
        ),
        const SizedBox(height: 16),
        for (final card in _cards(l10n)) ...[
          _ArticleCard(
            card: card,
            expanded: _expandedId == card.id,
            onToggle: () => setState(
              () => _expandedId = _expandedId == card.id ? null : card.id,
            ),
            onCopySource: _copyText,
          ),
          const SizedBox(height: 16),
        ],
      ],
    );
  }

  Future<void> _copyText(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context)!.copiedLink)),
    );
  }
}

class _ArticleCard extends StatelessWidget {
  const _ArticleCard({
    required this.card,
    required this.expanded,
    required this.onToggle,
    required this.onCopySource,
  });

  final _KbCard card;
  final bool expanded;
  final VoidCallback onToggle;
  final ValueChanged<String> onCopySource;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isRisk = card.isRisk;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(28),
        onTap: onToggle,
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isRisk
                          ? const Color(0xFFF6E0DB)
                          : const Color(0xFFF3D8D8),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      card.tag,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Spacer(),
                  Text(expanded ? l10n.collapse : l10n.expand),
                ],
              ),
              const SizedBox(height: 14),
              Text(card.title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isRisk
                      ? const Color(0xFFFBF0ED)
                      : Colors.white.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Text(card.lead),
              ),
              if (expanded) ...[
                const SizedBox(height: 12),
                for (final paragraph in card.body) ...[
                  Text(paragraph),
                  const SizedBox(height: 10),
                ],
                if (card.bullets.isNotEmpty) ...[
                  Text(
                    l10n.keyPoints,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  for (final bullet in card.bullets)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text('• $bullet'),
                    ),
                ],
                if (card.redFlags.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    l10n.redFlags,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final item in card.redFlags)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBF0ED),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text('• $item'),
                    ),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final source in card.sources)
                      ActionChip(
                        label: Text(source.label),
                        onPressed: () => onCopySource(source.url),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _KbCard {
  const _KbCard({
    required this.id,
    required this.tag,
    required this.title,
    required this.lead,
    required this.body,
    required this.bullets,
    this.redFlags = const [],
    required this.sources,
    this.isRisk = false,
  });

  final String id;
  final String tag;
  final String title;
  final String lead;
  final List<String> body;
  final List<String> bullets;
  final List<String> redFlags;
  final List<_Source> sources;
  final bool isRisk;
}

class _Source {
  const _Source(this.label, this.url);

  final String label;
  final String url;
}
