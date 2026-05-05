import 'package:flutter/material.dart';

class FlowPage extends StatelessWidget {
  const FlowPage({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.actions,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.headlineMedium),
                  const SizedBox(height: 8),
                  Text(subtitle, style: theme.textTheme.bodyLarge),
                ],
              ),
            ),
            if (actions != null) ...actions!,
          ],
        ),
        const SizedBox(height: 20),
        ...children,
      ],
    );
  }
}
