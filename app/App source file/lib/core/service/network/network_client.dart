import 'dart:convert';
import 'package:logger/logger.dart';
import 'package:dio/dio.dart';

part 'network_responce.dart';

class NetworkClient {
  final Logger _logger = Logger();
  final String _defaultErrorMessage = 'Something went wrong';

  static const _sessionRetryKey = 'cleango_session_retry';

  final Future<void> Function() onUnAuthorize;
  final Future<bool> Function() refreshSession;
  final Map<String, String> Function() commonHeaders;

  /// You can inject a preconfigured Dio if you want (for tests or custom baseUrl).
  final Dio _dio;

  NetworkClient({
    required this.onUnAuthorize,
    required this.refreshSession,
    required this.commonHeaders,
    Dio? dio,
    String? baseUrl,
    Duration connectTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 20),
    Duration sendTimeout = const Duration(seconds: 20),
  }) : _dio = dio ??
      Dio(
        BaseOptions(
          baseUrl: baseUrl ?? '',
          connectTimeout: connectTimeout,
          receiveTimeout: receiveTimeout,
          sendTimeout: sendTimeout,
          // Don’t throw on non-200; we’ll handle statuses ourselves.
          validateStatus: (code) => code != null && code >= 100 && code < 600,
          // Let server decide content-type; we’ll still send JSON bodies.
          responseType: ResponseType.json,
          followRedirects: false,
        ),
      ) {
    // Basic interceptors for headers, session recovery, and logging.
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final headers = commonHeaders();
          options.headers.addAll(headers);
          _logRequest(options);
          handler.next(options);
        },
        onResponse: (response, handler) async {
          _logResponse(response);
          if (!_shouldRefresh(response.statusCode, response.requestOptions)) {
            handler.next(response);
            return;
          }

          try {
            final retriedResponse = await _refreshAndRetry(
              response.requestOptions,
            );
            if (retriedResponse == null) {
              handler.next(response);
              return;
            }
            handler.resolve(retriedResponse);
          } on DioException catch (error) {
            handler.reject(error);
          }
        },
        onError: (error, handler) async {
          _logError(error);
          if (!_shouldRefresh(
            error.response?.statusCode,
            error.requestOptions,
          )) {
            handler.next(error);
            return;
          }

          try {
            final retriedResponse = await _refreshAndRetry(
              error.requestOptions,
            );
            if (retriedResponse == null) {
              handler.next(error);
              return;
            }
            handler.resolve(retriedResponse);
          } on DioException catch (retryError) {
            handler.next(retryError);
          }
        },
      ),
    );
  }

  bool _shouldRefresh(int? statusCode, RequestOptions options) {
    return statusCode == 401 &&
        options.extra[_sessionRetryKey] != true &&
        !options.path.endsWith('/auth/refresh-token');
  }

  Future<Response<dynamic>?> _refreshAndRetry(
    RequestOptions requestOptions,
  ) async {
    requestOptions.extra[_sessionRetryKey] = true;
    final refreshed = await refreshSession();
    if (!refreshed) {
      await onUnAuthorize();
      return null;
    }

    requestOptions.headers.remove('Authorization');
    requestOptions.headers.addAll(commonHeaders());
    if (requestOptions.data is FormData) {
      requestOptions.data = (requestOptions.data as FormData).clone();
    }

    final response = await _dio.fetch<dynamic>(requestOptions);
    if (response.statusCode == 401) {
      await onUnAuthorize();
    }
    return response;
  }
  // -------------------- PUBLIC METHODS --------------------
  Future<NetworkResponse> getRequest(
      String url, {
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
        String? bearerToken,
        Map<String, String>? headers,
      }) async {
    try {
      // ✅ Merge global + custom headers safely
      final mergedHeaders = <String, String>{};

      // Step 1: start with global headers
      mergedHeaders.addAll(commonHeaders());

      // Step 2: add per-request headers
      if (headers != null) mergedHeaders.addAll(headers);

      // Step 3: override Authorization only if provided
      if (bearerToken != null && bearerToken.isNotEmpty) {
        mergedHeaders['Authorization'] = 'Bearer $bearerToken';
      }

      final Response response = await _dio.get(
        url,
        queryParameters: query,
        cancelToken: cancelToken,
        options: Options(headers: mergedHeaders),
      );

      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }


  Future<NetworkResponse> postRequest(
      String url, {
        Map<String, dynamic>? body,
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
        String? bearerToken,
        Map<String, String>? headers,
      }) async {
    try {
      final mergedHeaders = <String, String>{}
        ..addAll(commonHeaders())
        ..addAll(headers ?? {});
      if (bearerToken != null && bearerToken.isNotEmpty) {
        mergedHeaders['Authorization'] = 'Bearer $bearerToken';
      }

      final Response response = await _dio.post(
        url,
        data: body,
        queryParameters: query,
        cancelToken: cancelToken,
        options: Options(headers: mergedHeaders),
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }


  Future<NetworkResponse> putRequest(
      String url, {
        dynamic body, // <-- changed from Map<String, dynamic>?
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
      }) async {
    try {
      final Response response = await _dio.put(
        url,
        data: body, // Works with Map OR FormData
        queryParameters: query,
        cancelToken: cancelToken,
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }

  /// Upload file via multipart/form-data POST
  Future<NetworkResponse> uploadRequest(
      String url, {
        required FormData formData,
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
      }) async {
    try {
      final Response response = await _dio.post(
        url,
        data: formData,
        queryParameters: query,
        cancelToken: cancelToken,
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }


  Future<NetworkResponse> patchRequest(
      String url, {
        Map<String, dynamic>? body,
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
      }) async {
    try {
      final Response response = await _dio.patch(
        url,
        data: body,
        queryParameters: query,
        cancelToken: cancelToken,
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }

  Future<NetworkResponse> deleteRequest(
      String url, {
        Map<String, dynamic>? body,
        Map<String, dynamic>? query,
        CancelToken? cancelToken,
      }) async {
    try {
      final Response response = await _dio.delete(
        url,
        data: body,
        queryParameters: query,
        cancelToken: cancelToken,
      );
      return _handleResponse(response);
    } on DioException catch (e) {
      return _handleDioError(e);
    } catch (e) {
      return _unknownError(e);
    }
  }

  // -------------------- INTERNAL HANDLERS --------------------

  NetworkResponse _handleResponse(Response response) {
    final status = response.statusCode ?? -1;

    // Normalize data: Dio may already give Map/List; if it's String, try parse
    final dynamic data = _normalizeData(response.data);

    if (status == 200 || status == 201) {
      return NetworkResponse(
        isSuccess: true,
        statusCode: status,
        responseData: data,
      );
    }

    if (status == 401) {
      return NetworkResponse(
        isSuccess: false,
        statusCode: status,
        errorMessage: 'Un-authorize',
        responseData: data,
      );
    }

    // Generic failure with best-effort message extraction
    final msg = _extractMessage(data) ?? _defaultErrorMessage;
    return NetworkResponse(
      isSuccess: false,
      statusCode: status,
      errorMessage: msg,
      responseData: data,
    );
  }

  NetworkResponse _handleDioError(DioException e) {
    // If there’s a response, treat like HTTP error
    final res = e.response;
    if (res != null) {
      final status = res.statusCode ?? -1;
      final dynamic data = _normalizeData(res.data);

      if (status == 401) {
          return NetworkResponse(
          isSuccess: false,
          statusCode: status,
          errorMessage: 'Un-authorize',
          responseData: data,
        );
      }

      final msg = _extractMessage(data) ?? e.message ?? _defaultErrorMessage;
      return NetworkResponse(
        isSuccess: false,
        statusCode: status,
        errorMessage: msg,
        responseData: data,
      );
    }

    // No response: network / timeout / cancel
    final errMsg = switch (e.type) {
    // DioExceptionType.connectionTimeout => 'Connection timed out',
      DioExceptionType.sendTimeout => 'Send timed out',
      DioExceptionType.receiveTimeout => 'Receive timed out',
      DioExceptionType.cancel => 'Request cancelled',
      DioExceptionType.connectionError => 'Network error',
      DioExceptionType.badCertificate => 'Bad certificate',
      _ => e.message ?? _defaultErrorMessage,
    };

    return NetworkResponse(
      isSuccess: false,
      statusCode: -1,
      errorMessage: errMsg,
    );
  }

  NetworkResponse _unknownError(Object e) {
    return NetworkResponse(
      isSuccess: false,
      statusCode: -1,
      errorMessage: e.toString(),
    );
  }

  // -------------------- LOGGING --------------------

  void _logRequest(RequestOptions options) {
    final msg = '''
[REQUEST]
URL -> ${options.baseUrl}${options.path.isNotEmpty ? options.path : ''}
METHOD -> ${options.method}
QUERY -> ${options.queryParameters}
HEADERS -> ${options.headers}
BODY -> ${_safeBodyPreview(options.data)}
''';
    _logger.i(msg);
  }

  void _logResponse(Response response) {
    final req = response.requestOptions;
    final msg = '''
[RESPONSE]
URL -> ${req.baseUrl}${req.path}
STATUS CODE -> ${response.statusCode}
REQUEST HEADERS -> ${req.headers}
RESPONSE HEADERS -> ${response.headers.map}
BODY -> ${_safeBodyPreview(response.data)}
''';
    _logger.i(msg);
  }

  void _logError(DioException e) {
    final req = e.requestOptions;
    final status = e.response?.statusCode;
    final msg = '''
[ERROR]
URL -> ${req.baseUrl}${req.path}
METHOD -> ${req.method}
STATUS CODE -> $status
TYPE -> ${e.type}
MESSAGE -> ${e.message}
REQUEST BODY -> ${_safeBodyPreview(req.data)}
RESPONSE BODY -> ${_safeBodyPreview(e.response?.data)}
''';
    _logger.e(msg);
  }

  // -------------------- HELPERS --------------------

  dynamic _normalizeData(dynamic data) {
    // Dio commonly returns Map/List already.
    // If it’s a String (e.g., text/plain), try parsing JSON.
    if (data is String) {
      try {
        return jsonDecode(data);
      } catch (_) {
        return data; // keep raw string
      }
    }
    return data;
  }

  String? _extractMessage(dynamic data) {
    if (data is Map) {
      // try common fields
      for (final k in ['msg', 'message', 'error', 'detail']) {
        final v = data[k];
        if (v is String && v.trim().isNotEmpty) return v;
      }
    }
    return null;
  }

  String _safeBodyPreview(dynamic body) {
    if (body == null) return 'null';
    if (body is String) return body;
    try {
      return jsonEncode(body);
    } catch (_) {
      return body.toString();
    }
  }
}