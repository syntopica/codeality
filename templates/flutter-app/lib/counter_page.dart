import 'package:flutter/material.dart';

/// A page counting taps on its button.
class CounterPage extends StatefulWidget {
  const CounterPage({super.key});

  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  int _count = 0;

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(child: Text('$_count')),
    floatingActionButton: FloatingActionButton(
      onPressed: () => setState(() => _count++),
      tooltip: 'Increment',
      child: const Icon(Icons.add),
    ),
  );
}
