import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/presentation/flow_page.dart';

class EncyclopediaPage extends StatefulWidget {
  const EncyclopediaPage({super.key});

  @override
  State<EncyclopediaPage> createState() => _EncyclopediaPageState();
}

class _EncyclopediaPageState extends State<EncyclopediaPage> {
  String? _expandedId;

  static const _cards = <_KbCard>[
    _KbCard(
      id: 'vital-sign',
      tag: '精细化管理',
      title: '月经是一项“生命体征”',
      lead: '周期、经量、颜色、痛感与出血模式，都是身体状态的信号。',
      body: [
        '把月经当成每月一次的健康快照，你会更早发现是否存在经量过多、贫血风险或长期疼痛问题。',
        '记录的价值不在于记得更多，而在于把模糊感受变成可比较、可解释、可与医生沟通的数据。',
      ],
      bullets: [
        '记录不是为了焦虑，而是为了更稳地掌控变化',
        '异常往往是趋势，不是某一天的偶发波动',
        '能说清变化，比单纯觉得不对劲更有帮助',
      ],
      sources: [
        _Source(
          'ACOG：月经是生命体征',
          'https://www.acog.org/womens-health/faqs/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign',
        ),
        _Source(
          'Mayo Clinic：月经周期基础',
          'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cycle/art-20047186',
        ),
      ],
    ),
    _KbCard(
      id: 'normal-range',
      tag: '常识',
      title: '了解正常范围，才更容易识别异常',
      lead: '判断月经是否正常，不能只看“来没来”。',
      body: ['周期、经期、总量、血块、颜色和疼痛都应该一起看，突然变化通常比单项偏高或偏低更值得关注。'],
      bullets: [
        '周期 21-35 天常见，重点是你自己的规律',
        '经期 3-8 天常见，超过 7 天且量多需要关注',
        '总量 20-80mL/周期常见，明显超出可能提示风险',
        '频繁大血块、明显头晕乏力、夜间漏血都值得记录',
      ],
      sources: [
        _Source(
          'CDC：重度月经出血',
          'https://www.cdc.gov/heavy-menstrual-bleeding/index.html',
        ),
      ],
    ),
    _KbCard(
      id: 'hmb',
      tag: '风险',
      title: '经量过多是最容易被忽视的风险之一',
      lead: '量大不等于体质好，也不应该靠硬扛。',
      body: ['如果需要频繁更换用品、经期明显影响睡眠或工作、伴随头晕乏力，就不应简单视为个体差异。'],
      bullets: [],
      redFlags: [
        '连续数小时每小时就浸透 1 片卫生巾/棉条',
        '需要半夜起床更换，或不得不叠加使用多种用品',
        '经期超过 7 天且明显影响生活',
        '伴随贫血症状，如乏力、头晕、心慌、气短',
      ],
      sources: [
        _Source('NHS：经量过多', 'https://www.nhs.uk/conditions/heavy-periods/'),
        _Source(
          'Mayo Clinic：重度月经出血',
          'https://www.mayoclinic.org/diseases-conditions/menorrhagia/symptoms-causes/syc-20351256',
        ),
      ],
    ),
    _KbCard(
      id: 'track',
      tag: '自检',
      title: '建议稳定记录的 6 个关键维度',
      lead: '少而精，形成趋势就足够有价值。',
      body: ['只要稳定记录以下维度，就足以支撑分析页的趋势判断和风险提示。'],
      bullets: [
        '开始/结束日期与持续天数',
        '每天经量或用品更换频率',
        '颜色与血块',
        '疼痛强度与是否用药',
        '是否存在非经期出血',
        '精力与睡眠变化',
      ],
      sources: [
        _Source(
          'WHO：子宫内膜异位症',
          'https://www.who.int/news-room/fact-sheets/detail/endometriosis',
        ),
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return FlowPage(
      title: '百科',
      subtitle: '把月经量、风险和变化说清楚。',
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  '把月经量，说清楚',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                ),
                SizedBox(height: 8),
                Text('月经量不是主观感受，而是可以被理解、被估算、被判断的生理指标。'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        for (final card in _cards) ...[
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
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('已复制链接')));
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
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onToggle,
        child: Padding(
          padding: const EdgeInsets.all(20),
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
                      color: const Color(0xFFF3D8D8),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      card.tag,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Spacer(),
                  Text(expanded ? '收起' : '展开'),
                ],
              ),
              const SizedBox(height: 14),
              Text(card.title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(card.lead),
              if (expanded) ...[
                const SizedBox(height: 12),
                for (final paragraph in card.body) ...[
                  Text(paragraph),
                  const SizedBox(height: 10),
                ],
                if (card.bullets.isNotEmpty) ...[
                  const Text(
                    '要点',
                    style: TextStyle(fontWeight: FontWeight.w700),
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
                  const Text(
                    '红旗信号',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  for (final item in card.redFlags)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
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
  });

  final String id;
  final String tag;
  final String title;
  final String lead;
  final List<String> body;
  final List<String> bullets;
  final List<String> redFlags;
  final List<_Source> sources;
}

class _Source {
  const _Source(this.label, this.url);

  final String label;
  final String url;
}
