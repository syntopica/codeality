import 'package:flutter/material.dart';

import 'counter_page.dart';

/// The app shell.
class CounterApp extends StatelessWidget {
  const CounterApp({super.key});

  @override
  Widget build(BuildContext context) => const MaterialApp(home: CounterPage());
}
