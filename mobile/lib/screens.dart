import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'widgets.dart';

class AuthScreen extends StatefulWidget {
  final MushroomApi api;
  const AuthScreen({super.key, required this.api});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController(),
      password = TextEditingController(),
      name = TextEditingController();
  final form = GlobalKey<FormState>();
  bool register = false, busy = false;
  String? error;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      if (register) {
        await widget.api.request(
          '/auth/register',
          method: 'POST',
          body: {
            'email': email.text.trim(),
            'password': password.text,
            'name': name.text.trim(),
          },
        );
      }
      await widget.api.login(email.text, password.text);
    } catch (failure) {
      if (mounted) setState(() => error = failure.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Form(
            key: form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.spa_outlined,
                  size: 64,
                  color: Color(0xff426b45),
                ),
                const SizedBox(height: 16),
                const Text(
                  'SMART MUSHROOM',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    letterSpacing: 3,
                    fontWeight: FontWeight.bold,
                    color: Color(0xff426b45),
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  register ? 'Bắt đầu mùa nấm của bạn' : 'Chào bạn trở lại',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Thuê khay, theo dõi tiến trình và nhận nấm từ nông trại.',
                ),
                const SizedBox(height: 28),
                if (register) ...[
                  TextFormField(
                    controller: name,
                    decoration: const InputDecoration(labelText: 'Họ tên'),
                    maxLength: 100,
                    validator: (v) =>
                        (v?.trim().isEmpty ?? true) ? 'Nhập họ tên.' : null,
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: email,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  validator: (v) =>
                      (v == null ||
                          !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                              .hasMatch(v.trim()))
                      ? 'Email không hợp lệ.'
                      : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: password,
                  decoration: const InputDecoration(labelText: 'Mật khẩu'),
                  obscureText: true,
                  maxLength: 128,
                  validator: (v) =>
                      (v == null || v.isEmpty || (register && v.length < 12))
                      ? 'Nhập mật khẩu${register ? ' tối thiểu 12 ký tự' : ''}.'
                      : null,
                  onFieldSubmitted: (_) {
                    if (!busy) submit();
                  },
                ),
                const SizedBox(height: 18),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                FilledButton(
                  onPressed: busy ? null : submit,
                  child: Text(
                    busy
                        ? 'Đang kết nối…'
                        : register
                        ? 'Đăng ký & đăng nhập'
                        : 'Đăng nhập',
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: busy
                      ? null
                      : () => setState(() {
                          register = !register;
                          error = null;
                        }),
                  child: Text(
                    register
                        ? 'Đã có tài khoản? Đăng nhập'
                        : 'Chưa có tài khoản? Đăng ký',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class CustomerHome extends StatefulWidget {
  final MushroomApi api;
  const CustomerHome({super.key, required this.api});
  @override
  State<CustomerHome> createState() => _CustomerHomeState();
}

class _CustomerHomeState extends State<CustomerHome> {
  int index = 0;
  @override
  Widget build(BuildContext context) {
    final api = widget.api;
    final pages = [
      RentalsScreen(api: api),
      CatalogScreen(api: api),
      HarvestScreen(api: api),
      NotificationsScreen(api: api),
      ProfileScreen(api: api),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Mushroom'),
        actions: [
          IconButton(
            tooltip: 'Liên kết mã khay',
            icon: const Icon(Icons.qr_code_2),
            onPressed: () async {
              final code = await askText(
                context,
                title: 'Liên kết khay đã được cấp',
                label: 'Mã khay',
                maxLength: 40,
              );
              if (code == null) return;
              try {
                final item = await api.request(
                  '/trays/link',
                  method: 'POST',
                  body: {'code': code},
                ) as Json;
                if (context.mounted) {
                  Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => ItemScreen(api: api, id: item['id']),
                    ),
                  );
                }
              } catch (error) {
                if (context.mounted) showMessage(context, error);
              }
            },
          ),
        ],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grass_outlined),
            label: 'Khay của tôi',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_box_outlined),
            label: 'Thuê khay',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            label: 'Nhận nấm',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_outlined),
            label: 'Thông báo',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Hồ sơ',
          ),
        ],
      ),
    );
  }
}

class RentalsScreen extends StatefulWidget {
  final MushroomApi api;
  const RentalsScreen({super.key, required this.api});
  @override
  State<RentalsScreen> createState() => _RentalsScreenState();
}

class _RentalsScreenState extends State<RentalsScreen> {
  String? status;
  List<String?> cursors = [null];
  late Future<RentalsPage> future;
  @override
  void initState() {
    super.initState();
    future = widget.api.rentalsPage();
    future.ignore();
  }

  void load() {
    final next = widget.api.rentalsPage(status: status, cursor: cursors.last);
    // Observe fast failures before FutureBuilder subscribes on the next frame.
    // The original future still delivers its error to the builder for retry UI.
    next.ignore();
    setState(() {
      future = next;
    });
  }

  Future<void> refresh() async {
    final next = widget.api.rentalsPage(status: status);
    next.ignore();
    setState(() {
      cursors = [null];
      future = next;
    });
    try {
      await next;
    } catch (_) {
      /* The FutureBuilder displays the error. */
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
        child: DropdownButtonFormField<String>(
          initialValue: status ?? 'all',
          decoration: const InputDecoration(labelText: 'Trạng thái hợp đồng'),
          items: const [
            DropdownMenuItem(value: 'all', child: Text('Tất cả trạng thái')),
            DropdownMenuItem(value: 'active', child: Text('Đang thuê')),
            DropdownMenuItem(value: 'completed', child: Text('Hoàn tất')),
          ],
          onChanged: (value) {
            status = value == 'all' ? null : value;
            cursors = [null];
            load();
          },
        ),
      ),
      Expanded(
        child: FutureBuilder<RentalsPage>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        snapshot.error.toString(),
                        textAlign: TextAlign.center,
                      ),
                      FilledButton(
                        onPressed: load,
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                ),
              );
            }
            final page = snapshot.data!;
            return Column(
              children: [
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: refresh,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        Text(
                          'Khay của tôi',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const Text(
                          'Hợp đồng hiện tại và lịch sử thuê của bạn.',
                        ),
                        const SizedBox(height: 20),
                        if (page.rentals.isEmpty)
                          EmptyState(
                            status == null
                                ? 'Bạn chưa có hợp đồng. Mở Thuê khay để bắt đầu.'
                                : 'Chưa có hợp đồng phù hợp bộ lọc.',
                          ),
                        ...page.rentals.map(
                          (r) => Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(18),
                              leading: const Icon(Icons.spa_outlined),
                              title: Text(
                                '${r['tray_count']} khay · ${r['duration_days']} ngày',
                              ),
                              subtitle: Text(
                                'Từ ${formattedDate(r['starts_at'])}\n${vnd(r['price_per_tray_vnd'])} / khay',
                              ),
                              trailing: StatusChip(r['status']),
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute<void>(
                                  builder: (_) => RentalScreen(
                                    api: widget.api,
                                    id: r['id'],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton(
                        onPressed: cursors.length == 1
                            ? null
                            : () {
                                cursors.removeLast();
                                load();
                              },
                        child: const Text('Trang trước'),
                      ),
                      Text(
                        'Trang ${cursors.length}',
                        semanticsLabel: 'Trang ${cursors.length}',
                      ),
                      TextButton(
                        onPressed: page.hasMore
                            ? () {
                                cursors.add(page.nextCursor);
                                load();
                              }
                            : null,
                        child: const Text('Trang sau'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    ],
  );
}

class RentalScreen extends StatelessWidget {
  final MushroomApi api;
  final String id;
  const RentalScreen({super.key, required this.api, required this.id});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Chi tiết hợp đồng')),
    body: AsyncContent<Json>(
      load: () async =>
          Map<String, dynamic>.from(await api.request('/rentals/$id')),
      builder: (r) => ListView(
        padding: const EdgeInsets.all(20),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          StatusChip(r['status']),
          Text('Bắt đầu: ${formattedDate(r['starts_at'])}'),
          Text('Kết thúc dự kiến: ${formattedDate(r['expected_end_at'])}'),
          const SizedBox(height: 20),
          ...rows(r['items']).map(
            (i) => Card(
              child: ListTile(
                title: Text(i['code']),
                subtitle: Text(i['label']),
                trailing: StatusChip(i['stage']),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => ItemScreen(api: api, id: i['id']),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Lịch sử giao dịch',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const Text(
            'Thu tiền thủ công tại cơ sở. Ứng dụng không thanh toán online.',
          ),
          ...rows(r['transactions']).map(
            (t) => ListTile(
              title: Text(vnd(t['amount_vnd'])),
              subtitle: Text(formattedDate(t['created_at'])),
              trailing: StatusChip(t['status']),
            ),
          ),
        ],
      ),
    ),
  );
}

class CatalogScreen extends StatefulWidget {
  final MushroomApi api;
  const CatalogScreen({super.key, required this.api});
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final selected = <String>{};
  final searchController = TextEditingController();
  String search = '';
  Json? currentCatalog;
  int catalogGeneration = 0;
  bool loadingMore = false;
  String? planId;
  bool busy = false;
  int revision = 0;
  Json pageOf(Json catalog, String kind) {
    final pages = catalog['pagination'];
    if (pages is! Json) return {};
    final page = pages[kind];
    return page is Json ? page : {};
  }

  String catalogPath({String? kind, String? cursor}) {
    final query = {'limit': '20', if (search.isNotEmpty) 'tray_q': search};
    if (cursor != null) {
      query[kind == 'trays' ? 'tray_cursor' : 'plan_cursor'] = cursor;
    }
    return '/catalog?${Uri(queryParameters: query).query}';
  }

  Future<Json> loadCatalog() async {
    final generation = ++catalogGeneration;
    currentCatalog = null;
    loadingMore = false;
    selected.clear();
    planId = null;
    final catalog = Map<String, dynamic>.from(
      await widget.api.request(catalogPath()),
    );
    if (mounted && generation == catalogGeneration) currentCatalog = catalog;
    return catalog;
  }

  Future<void> loadMore(String kind) async {
    final catalog = currentCatalog;
    if (catalog == null || loadingMore || busy) return;
    final cursor = pageOf(catalog, kind)['next_cursor'];
    if (cursor is! String) return;
    final generation = catalogGeneration;
    setState(() => loadingMore = true);
    try {
      final next = Map<String, dynamic>.from(
        await widget.api.request(catalogPath(kind: kind, cursor: cursor)),
      );
      if (!mounted || generation != catalogGeneration) return;
      setState(() {
        final active = currentCatalog!;
        final unique = {
          for (final row in [...rows(active[kind]), ...rows(next[kind])])
            row['id']: row,
        };
        currentCatalog = {
          ...active,
          kind: unique.values.toList(),
          'pagination': {
            'plans': pageOf(active, 'plans'),
            'trays': pageOf(active, 'trays'),
            kind: pageOf(next, kind),
          },
        };
      });
    } catch (error) {
      if (mounted && generation == catalogGeneration) {
        showMessage(context, error);
      }
    } finally {
      if (mounted && generation == catalogGeneration) {
        setState(() => loadingMore = false);
      }
    }
  }

  void applySearch() {
    if (busy) return;
    setState(() {
      search = searchController.text.trim();
      catalogGeneration++;
      revision++;
    });
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AsyncContent<Json>(
    key: ValueKey(revision),
    load: loadCatalog,
    builder: (catalog) {
      final active = currentCatalog ?? catalog;
      final plans = rows(active['plans']), trays = rows(active['trays']);
      return ListView(
        padding: const EdgeInsets.all(20),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          Text(
            'Bắt đầu một mùa nấm',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          const Text(
            'Chọn gói và khay trống. Giá được lưu tại thời điểm xác nhận thuê.',
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: searchController,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Tìm khay theo mã, tên hoặc phòng',
                    counterText: '',
                  ),
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => applySearch(),
                ),
              ),
              IconButton(
                tooltip: 'Tìm khay',
                onPressed: busy ? null : applySearch,
                icon: const Icon(Icons.search),
              ),
            ],
          ),
          const Text(
            'Xem thêm giữ lựa chọn; tìm kiếm hoặc làm mới sẽ hủy lựa chọn cũ.',
          ),
          if (loadingMore) const LinearProgressIndicator(),
          const SizedBox(height: 12),
          if (plans.isEmpty)
            const EmptyState('Chưa có gói thuê khả dụng.')
          else
            DropdownButtonFormField<String>(
              initialValue: plans.any((p) => p['id'] == planId) ? planId : null,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Gói thuê'),
              items: plans
                  .map(
                    (p) => DropdownMenuItem<String>(
                      value: p['id'],
                      child: Text(
                        '${p['name']} · ${p['duration_days']} ngày · ${vnd(p['price_vnd'])}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: busy || loadingMore
                  ? null
                  : (value) => setState(() => planId = value),
            ),
          if (pageOf(active, 'plans')['has_more'] == true)
            TextButton(
              onPressed: busy || loadingMore ? null : () => loadMore('plans'),
              child: const Text('Xem thêm gói thuê'),
            ),
          const SizedBox(height: 20),
          Text(
            'Khay trống (${trays.length} đã tải)',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (trays.isEmpty) const EmptyState('Hiện chưa còn khay trống.'),
          ...trays.map(
            (t) => Card(
              child: CheckboxListTile(
                value: selected.contains(t['id']),
                title: Text(t['code']),
                subtitle: Text('${t['label']} · ${t['room_name']}'),
                onChanged: busy || loadingMore
                    ? null
                    : (value) {
                        setState(() {
                          if (value == true && selected.length < 20) {
                            selected.add(t['id']);
                          } else {
                            selected.remove(t['id']);
                          }
                        });
                      },
              ),
            ),
          ),
          if (pageOf(active, 'trays')['has_more'] == true)
            TextButton(
              onPressed: busy || loadingMore ? null : () => loadMore('trays'),
              child: const Text('Xem thêm khay'),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: busy || loadingMore || planId == null || selected.isEmpty
                ? null
                : () async {
                    final selectedCount = selected.length;
                    setState(() => busy = true);
                    try {
                      final rental = await widget.api.request(
                        '/rentals',
                        method: 'POST',
                        body: {
                          'plan_id': planId,
                          'tray_ids': selected.toList(),
                        },
                      ) as Json;
                      if (!context.mounted) return;
                      showMessage(context, 'Đã thuê $selectedCount khay.');
                      selected.clear();
                      setState(() => revision++);
                      Navigator.push(
                        context,
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              RentalScreen(api: widget.api, id: rental['id']),
                        ),
                      );
                    } catch (error) {
                      if (context.mounted) showMessage(context, error);
                    } finally {
                      if (mounted) setState(() => busy = false);
                    }
                  },
            child: Text(
              busy ? 'Đang xác nhận…' : 'Xác nhận thuê ${selected.length} khay',
            ),
          ),
        ],
      );
    },
  );
}

class ItemScreen extends StatelessWidget {
  final MushroomApi api;
  final String id;
  const ItemScreen({super.key, required this.api, required this.id});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Theo dõi khay')),
    body: AsyncContent<Json>(
      poll: const Duration(seconds: 30),
      load: () async {
        final item = Map<String, dynamic>.from(
          await api.request('/rental-items/$id'),
        );
        if (item['ended_at'] == null) {
          item['environment'] = await api.request(
            '/rooms/${item['room_id']}/environment?limit=30',
          );
          item['camera'] = await api.request(
            '/rooms/${item['room_id']}/camera',
          );
        }
        return item;
      },
      builder: (item) {
        final samples = rows(item['environment']?['readings'] ?? []),
            events = rows(item['events']);
        final latest = samples.isEmpty ? null : samples.first;
        return ListView(
          padding: const EdgeInsets.all(20),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            Text(
              item['code'],
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(item['label']),
            Align(
              alignment: Alignment.centerLeft,
              child: StatusChip(item['stage']),
            ),
            Text(
              'Thu hoạch dự kiến: ${formattedDate(item['expected_harvest_at'])}',
            ),
            const SizedBox(height: 20),
            Text(
              'Môi trường phòng trồng',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Text(
              'Mẫu đo chung của phòng chứa khay, không phải cảm biến riêng trên khay.',
            ),
            if (item['ended_at'] != null)
              const EmptyState(
                'Hợp đồng đã hoàn tất; không còn quyền xem môi trường/camera hiện tại.',
              )
            else if (latest == null)
              const EmptyState('Chưa có mẫu cảm biến trong thời gian thuê.')
            else ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${latest['temperature']} °C · ${latest['humidity']} %RH · ${latest['co2']} ppm',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${latest['simulated'] ? 'MÔ PHỎNG' : 'Nguồn thiết bị hardware'} · ${formattedDate(latest['recorded_at'])}',
                      ),
                    ],
                  ),
                ),
              ),
              ExpansionTile(
                title: const Text('Lịch sử cảm biến'),
                children: samples
                    .map(
                      (s) => ListTile(
                        title: Text(
                          '${s['temperature']} °C · ${s['humidity']} %RH · ${s['co2']} ppm',
                        ),
                        subtitle: Text(formattedDate(s['recorded_at'])),
                      ),
                    )
                    .toList(),
              ),
            ],
            if (item['ended_at'] == null) ...[
              if (item['camera']?['configured'] == true)
                OutlinedButton.icon(
                  icon: const Icon(Icons.videocam_outlined),
                  label: const Text('Mở camera được cung cấp'),
                  onPressed: () async {
                    try {
                      if (!await launchUrl(
                        Uri.parse(item['camera']['url']),
                        mode: LaunchMode.externalApplication,
                      )) {
                        throw ApiException('Không mở được kênh camera.');
                      }
                    } catch (error) {
                      if (context.mounted) showMessage(context, error);
                    }
                  },
                )
              else
                const Text('Chưa có kênh camera cho phòng này.'),
              const Text(
                'Luồng camera chưa được nghiệm thu phần cứng.',
                style: TextStyle(fontSize: 12),
              ),
            ],
            const SizedBox(height: 24),
            Text(
              'Nhật ký nuôi trồng',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (events.isEmpty)
              const EmptyState('Chưa có cập nhật tiến trình.'),
            ...events.map(
              (e) => ListTile(
                leading: const Icon(Icons.eco_outlined),
                title: Text(labels[e['stage']] ?? e['stage']),
                subtitle: Text(
                  '${e['note']}\n${formattedDate(e['created_at'])}',
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Thu hoạch', style: Theme.of(context).textTheme.titleLarge),
            ...rows(item['harvests']).map(
              (h) => ListTile(
                title: Text('${h['weight_grams']} g'),
                subtitle: Text(formattedDate(h['harvested_at'])),
              ),
            ),
          ],
        );
      },
    ),
  );
}

class HarvestScreen extends StatefulWidget {
  final MushroomApi api;
  const HarvestScreen({super.key, required this.api});
  @override
  State<HarvestScreen> createState() => _HarvestScreenState();
}

class _HarvestScreenState extends State<HarvestScreen> {
  int revision = 0;
  @override
  Widget build(BuildContext context) => AsyncContent<Json>(
    key: ValueKey(revision),
    load: () async => {
      'harvests': await widget.api.request('/harvests'),
      'requests': await widget.api.request('/fulfillment-requests'),
    },
    builder: (data) => ListView(
      padding: const EdgeInsets.all(20),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Text(
          'Nhận thành quả của bạn',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        if (rows(data['harvests']).isEmpty)
          const EmptyState(
            'Nấm chưa được thu hoạch. Bạn sẽ nhận thông báo khi sẵn sàng.',
          ),
        ...rows(data['harvests']).map(
          (h) => Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${h['code']} · ${h['weight_grams']} g',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(formattedDate(h['harvested_at'])),
                  if (h['fulfillment_id'] == null)
                    FilledButton(
                      onPressed: () async {
                        final ok = await showDialog<bool>(
                          context: context,
                          builder: (_) => FulfillmentDialog(
                            api: widget.api,
                            harvestId: h['id'],
                          ),
                        );
                        if (ok == true && mounted) setState(() => revision++);
                      },
                      child: const Text('Yêu cầu nhận / giao'),
                    )
                  else
                    StatusChip(h['fulfillment_status']),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Yêu cầu của tôi', style: Theme.of(context).textTheme.titleLarge),
        ...rows(data['requests']).map(
          (r) => Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${r['code']} · ${labels[r['method']]}'),
                  if (r['address'] != null) Text(r['address']),
                  StatusChip(r['status']),
                  if (['requested', 'cancelled'].contains(r['status']))
                    TextButton(
                      onPressed: () async {
                        try {
                          await widget.api.request(
                            '/fulfillment-requests/${r['id']}',
                            method: 'PATCH',
                            body: {
                              'status': r['status'] == 'requested'
                                  ? 'cancelled'
                                  : 'requested',
                            },
                          );
                          if (mounted) setState(() => revision++);
                        } catch (error) {
                          if (context.mounted) showMessage(context, error);
                        }
                      },
                      child: Text(
                        r['status'] == 'requested'
                            ? 'Hủy yêu cầu'
                            : 'Gửi lại yêu cầu',
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

class FulfillmentDialog extends StatefulWidget {
  final MushroomApi api;
  final String harvestId;
  const FulfillmentDialog({
    super.key,
    required this.api,
    required this.harvestId,
  });
  @override
  State<FulfillmentDialog> createState() => _FulfillmentDialogState();
}

class _FulfillmentDialogState extends State<FulfillmentDialog> {
  String method = 'pickup';
  final address = TextEditingController();
  bool busy = false;
  String? error;
  @override
  void dispose() {
    address.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Nhận nấm'),
    content: SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            initialValue: method,
            decoration: const InputDecoration(labelText: 'Hình thức nhận'),
            items: const [
              DropdownMenuItem(value: 'pickup', child: Text('Nhận tại trại')),
              DropdownMenuItem(value: 'delivery', child: Text('Giao hàng')),
            ],
            onChanged: busy ? null : (v) => setState(() => method = v!),
          ),
          if (method == 'delivery')
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: TextField(
                controller: address,
                maxLength: 1000,
                decoration: const InputDecoration(
                  labelText: 'Địa chỉ giao hàng',
                ),
              ),
            ),
          if (error != null)
            Text(
              error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
        ],
      ),
    ),
    actions: [
      TextButton(
        onPressed: busy ? null : () => Navigator.pop(context, false),
        child: const Text('Hủy'),
      ),
      FilledButton(
        onPressed: busy
            ? null
            : () async {
                if (method == 'delivery' && address.text.trim().isEmpty) {
                  setState(() => error = 'Cần địa chỉ giao hàng.');
                  return;
                }
                setState(() {
                  busy = true;
                  error = null;
                });
                try {
                  await widget.api.request(
                    '/fulfillment-requests',
                    method: 'POST',
                    body: {
                      'harvest_id': widget.harvestId,
                      'method': method,
                      if (method == 'delivery') 'address': address.text.trim(),
                    },
                  );
                  if (context.mounted) Navigator.pop(context, true);
                } catch (failure) {
                  if (mounted) setState(() => error = failure.toString());
                } finally {
                  if (mounted) setState(() => busy = false);
                }
              },
        child: Text(busy ? 'Đang gửi…' : 'Gửi yêu cầu'),
      ),
    ],
  );
}

class NotificationsScreen extends StatefulWidget {
  final MushroomApi api;
  const NotificationsScreen({super.key, required this.api});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  int revision = 0;
  @override
  Widget build(BuildContext context) => AsyncContent<List<Json>>(
    key: ValueKey(revision),
    poll: const Duration(seconds: 30),
    load: () async => rows(await widget.api.request('/notifications')),
    builder: (notes) => ListView(
      padding: const EdgeInsets.all(20),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Text('Thông báo', style: Theme.of(context).textTheme.headlineSmall),
        if (notes.isEmpty) const EmptyState('Bạn chưa có thông báo.'),
        ...notes.map(
          (n) => Card(
            child: ListTile(
              leading: Icon(
                n['read_at'] == null
                    ? Icons.notifications_active_outlined
                    : Icons.notifications_none,
              ),
              title: Text(n['message']),
              subtitle: Text(formattedDate(n['created_at'])),
              onTap: n['read_at'] != null
                  ? null
                  : () async {
                      try {
                        await widget.api.request(
                          '/notifications/${n['id']}/read',
                          method: 'PATCH',
                        );
                        if (mounted) setState(() => revision++);
                      } catch (error) {
                        if (context.mounted) showMessage(context, error);
                      }
                    },
            ),
          ),
        ),
      ],
    ),
  );
}

class ProfileScreen extends StatelessWidget {
  final MushroomApi api;
  const ProfileScreen({super.key, required this.api});
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      const Icon(
        Icons.account_circle_outlined,
        size: 72,
        color: Color(0xff426b45),
      ),
      const SizedBox(height: 16),
      Text(
        api.user?['name'] ?? '',
        style: Theme.of(context).textTheme.headlineSmall,
        textAlign: TextAlign.center,
      ),
      Text(api.user?['email'] ?? '', textAlign: TextAlign.center),
      const SizedBox(height: 32),
      OutlinedButton.icon(
        icon: const Icon(Icons.edit_outlined),
        label: const Text('Sửa họ tên'),
        onPressed: () async {
          final name = await askText(
            context,
            title: 'Sửa hồ sơ',
            label: 'Họ tên',
            initial: api.user?['name'] ?? '',
          );
          if (name == null) return;
          try {
            await api.updateName(name);
          } catch (error) {
            if (context.mounted) showMessage(context, error);
          }
        },
      ),
      const SizedBox(height: 16),
      FilledButton.tonal(
        onPressed: () async {
          try {
            await api.logout();
          } catch (error) {
            if (context.mounted) showMessage(context, error);
          }
        },
        child: const Text('Đăng xuất'),
      ),
    ],
  );
}
