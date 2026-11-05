import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

typedef Json = Map<String, dynamic>;
List<Json> rows(dynamic value) =>
    (value as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();

class ApiException implements Exception {
  final String message;
  final int status;
  ApiException(this.message, [this.status = 0]);
  @override
  String toString() => message;
}

class RentalsPage {
  final List<Json> rentals;
  final bool hasMore;
  final String? nextCursor;
  RentalsPage({required this.rentals, required this.hasMore, this.nextCursor});
  factory RentalsPage.fromJson(Json value) {
    final meta = value['pagination'];
    if (value['data'] is! List ||
        meta is! Map ||
        meta['has_more'] is! bool ||
        (meta['has_more'] == true &&
            (meta['next_cursor'] is! String ||
                (meta['next_cursor'] as String).isEmpty))) {
      throw ApiException('Phản hồi phân trang không hợp lệ. Vui lòng thử lại.');
    }
    return RentalsPage(
      rentals: rows(value['data']),
      hasMore: meta['has_more'],
      nextCursor: meta['next_cursor'] as String?,
    );
  }
}

class MushroomApi extends ChangeNotifier {
  final String baseUrl;
  final http.Client client;
  String? _token;
  Json? user;
  MushroomApi({String? baseUrl, http.Client? client})
    : baseUrl = baseUrl ?? const String.fromEnvironment('API_BASE_URL'),
      client = client ?? http.Client();
  String get origin => baseUrl.isEmpty
      ? (kIsWeb ? Uri.base.origin : 'http://10.0.2.2:3000')
      : baseUrl;
  Future<dynamic> request(
    String path, {
    String method = 'GET',
    Json? body,
    bool envelope = false,
  }) async {
    try {
      final request = http.Request(method, Uri.parse('$origin/api$path'));
      request.headers['Content-Type'] = 'application/json';
      if (_token != null) request.headers['Authorization'] = 'Bearer $_token';
      if (body != null) request.body = jsonEncode(body);
      final streamed = await client
          .send(request)
          .timeout(const Duration(seconds: 15));
      final response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 15));
      if (response.statusCode == 204) return null;
      final decoded = jsonDecode(utf8.decode(response.bodyBytes)) as Json;
      if (response.statusCode >= 400) {
        if (response.statusCode == 401 && _token != null) {
          _token = null;
          user = null;
          notifyListeners();
        }
        throw ApiException(
          decoded['error']?['message'] ?? 'Yêu cầu thất bại.',
          response.statusCode,
        );
      }
      return envelope ? decoded : decoded['data'];
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw ApiException('Kết nối quá thời gian. Vui lòng thử lại.');
    } catch (_) {
      throw ApiException(
        'Không kết nối được máy chủ hoặc phản hồi không hợp lệ.',
      );
    }
  }

  Future<RentalsPage> rentalsPage({
    String? status,
    String? cursor,
    int limit = 20,
  }) async {
    final filters = {'limit': '$limit'};
    if (status != null) {
      filters['status'] = status;
    }
    if (cursor != null) {
      filters['cursor'] = cursor;
    }
    final query = Uri(queryParameters: filters).query;
    final response = await request('/rentals?$query', envelope: true) as Json;
    return RentalsPage.fromJson(response);
  }

  Future<void> login(String email, String password) async {
    final data = await request(
      '/auth/login',
      method: 'POST',
      body: {'email': email.trim(), 'password': password},
    ) as Json;
    _token = data['token'] as String;
    if (data['user']['role'] != 'customer') {
      try {
        await request('/auth/logout', method: 'POST');
      } finally {
        _token = null;
      }
      throw ApiException('Ứng dụng dành cho Customer. Nhân viên sử dụng Web.');
    }
    user = Map<String, dynamic>.from(data['user']);
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      if (_token != null) await request('/auth/logout', method: 'POST');
    } finally {
      _token = null;
      user = null;
      notifyListeners();
    }
  }

  Future<void> updateName(String name) async {
    user = Map<String, dynamic>.from(
      await request('/auth/me', method: 'PATCH', body: {'name': name.trim()}),
    );
    notifyListeners();
  }

  @override
  void dispose() {
    client.close();
    super.dispose();
  }
}
