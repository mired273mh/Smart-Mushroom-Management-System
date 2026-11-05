export function createApi(token, onExpired) {
  const request = async (path, method = 'GET', body, envelope = false) => {
    let response;
    try {
      response = await fetch('/api' + path, {
        method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch { throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.'); }
    if (response.status === 204) return null;
    if (response.ok && response.headers.get('content-type')?.includes('text/csv')) return response.blob();
    if (response.status === 401 && token) onExpired?.(token);
    let result;
    try { result = await response.json(); }
    catch { throw new Error(`Máy chủ phản hồi không hợp lệ (HTTP ${response.status}). Vui lòng thử lại.`); }
    if (!response.ok) {
      throw new Error([result.error?.message ?? `Lỗi HTTP ${response.status}`, ...(result.error?.fields ?? []).map(f => `${f.path}: ${f.message}`)].join(' '));
    }
    return envelope ? result : result.data;
  };
  request.page = path => request(path, 'GET', undefined, true);
  return request;
}
