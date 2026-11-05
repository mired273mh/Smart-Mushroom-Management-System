import 'package:flutter/material.dart';

import 'api.dart';
import 'screens.dart';

void main() => runApp(MushroomApp(api: MushroomApi()));

class MushroomApp extends StatelessWidget {
  final MushroomApi api;
  const MushroomApp({super.key, required this.api});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: api,
    builder: (context, _) => MaterialApp(
      key: ValueKey(api.user?['id'] ?? 'guest'),
      title: 'Smart Mushroom',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff265c40)),
        scaffoldBackgroundColor: const Color(0xfff6f8f0),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xfff6f8f0),
          centerTitle: false,
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      home: api.user == null ? AuthScreen(api: api) : CustomerHome(api: api),
    ),
  );
}
