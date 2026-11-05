export function createApi(token, onExpired) {
  const request = async (path, method = 'GET', body, envelope = false) => {
    const response = await fetch('/api' + path, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return null;
    if (response.ok && response.headers.get('content-type')?.includes('text/csv')) return response.blob();
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 && token) onExpired();
      throw new Error([result.error?.message ?? `Lỗi HTTP ${response.status}`, ...(result.error?.fields ?? []).map(f => `${f.path}: ${f.message}`)].join(' '));
    }
    return envelope ? result : result.data;
  };
  request.page = path => request(path, 'GET', undefined, true);
  return request;
}
