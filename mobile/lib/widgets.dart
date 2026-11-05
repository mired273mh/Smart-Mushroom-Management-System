import 'dart:async';

import 'package:flutter/material.dart';

String formattedDate(dynamic value) {
  final t = DateTime.tryParse(value?.toString() ?? '')?.toLocal();
  if (t == null) return 'Chưa xác định';
  return '${t.day}/${t.month}/${t.year} ${t.hour}:${t.minute.toString().padLeft(2, '0')}';
}

String vnd(dynamic value) => '${value ?? 0} ₫';
const labels = {
  'active': 'Đang thuê',
  'completed': 'Hoàn tất',
  'incubation': 'Ủ phôi',
  'fruiting': 'Ra quả thể',
  'ready': 'Sẵn sàng thu hoạch',
  'harvested': 'Đã thu hoạch',
  'pending': 'Chờ xác nhận',
  'paid': 'Đã thu',
  'pickup': 'Nhận tại trại',
  'delivery': 'Giao hàng',
  'requested': 'Mới yêu cầu',
  'processing': 'Đang xử lý',
  'cancelled': 'Đã hủy',
};
void showMessage(BuildContext context, Object message) =>
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message.toString())));

class StatusChip extends StatelessWidget {
  final String value;
  const StatusChip(this.value, {super.key});
  @override
  Widget build(BuildContext context) => Chip(
    label: Text(labels[value] ?? value),
    visualDensity: VisualDensity.compact,
    backgroundColor: const Color(0xffe8efdf),
    side: BorderSide.none,
  );
}

class AsyncContent<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(T) builder;
  final Duration? poll;
  const AsyncContent({
    super.key,
    required this.load,
    required this.builder,
    this.poll,
  });
  @override
  State<AsyncContent<T>> createState() => _AsyncContentState<T>();
}

class _AsyncContentState<T> extends State<AsyncContent<T>>
    with WidgetsBindingObserver {
  late Future<T> future;
  Timer? timer;
  bool foreground = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    future = widget.load();
    if (widget.poll != null) {
      timer = Timer.periodic(widget.poll!, (_) {
        if (mounted && foreground) refresh().catchError((_) {});
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    foreground = state == AppLifecycleState.resumed;
  }

  Future<void> refresh() async {
    final next = widget.load();
    setState(() => future = next);
    await next;
  }

  @override
  void dispose() {
    timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
    future: future,
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_outlined, size: 40),
                const SizedBox(height: 12),
                Text(snapshot.error.toString(), textAlign: TextAlign.center),
                FilledButton(
                  onPressed: () {
                    refresh().catchError((_) {});
                  },
                  child: const Text('Thử lại'),
                ),
              ],
            ),
          ),
        );
      }
      return RefreshIndicator(
        onRefresh: () => refresh().catchError((_) {}),
        child: widget.builder(snapshot.data as T),
      );
    },
  );
}

class EmptyState extends StatelessWidget {
  final String text;
  const EmptyState(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
    child: Column(
      children: [
        const Icon(Icons.spa_outlined, size: 48, color: Color(0xff72946c)),
        const SizedBox(height: 16),
        Text(text, textAlign: TextAlign.center),
      ],
    ),
  );
}

Future<String?> askText(
  BuildContext context, {
  required String title,
  required String label,
  String initial = '',
  int maxLength = 100,
}) async {
  final controller = TextEditingController(text: initial);
  final result = await showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: TextField(
        controller: controller,
        autofocus: true,
        maxLength: maxLength,
        decoration: InputDecoration(labelText: label),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Hủy'),
        ),
        FilledButton(
          onPressed: () {
            if (controller.text.trim().isNotEmpty) {
              Navigator.pop(context, controller.text.trim());
            }
          },
          child: const Text('Xác nhận'),
        ),
      ],
    ),
  );
  await Future<void>.delayed(const Duration(milliseconds: 250));
  controller.dispose();
  return result;
}
