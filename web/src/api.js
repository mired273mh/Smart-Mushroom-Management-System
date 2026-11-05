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
  // Small configuration/assignment lookups: follow pages instead of silently
  // treating the first100 rows as the entire set. No arbitrary client row cap.
  request.all = async path => {
    const rows=new Map(),seen=new Set();let cursor=null;
    do {
      const params=new URLSearchParams({limit:'200',...(cursor?{cursor}:{})});
      const page=await request.page(path+'?'+params);
      for(const row of page.data)rows.set(row.id,row);
      cursor=page.pagination?.next_cursor??null;
      if(cursor&&seen.has(cursor))throw new Error('Mốc danh sách bị lặp. Hãy làm mới dữ liệu.');
      if(cursor)seen.add(cursor);
    } while(cursor);
    return [...rows.values()];
  };
  request.catalog = async () => {
    const first=await request('/catalog?limit=200'),result={plans:first.plans,trays:first.trays};
    for(const kind of ['plans','trays']){
      const rows=new Map(result[kind].map(row=>[row.id,row])),seen=new Set();
      let cursor=first.pagination?.[kind]?.next_cursor;
      while(cursor){
        if(seen.has(cursor))throw new Error('Mốc catalog bị lặp. Hãy làm mới dữ liệu.');
        seen.add(cursor);
        const params=new URLSearchParams({limit:'200',[kind==='plans'?'plan_cursor':'tray_cursor']:cursor});
        const page=await request('/catalog?'+params);
        for(const row of page[kind])rows.set(row.id,row);
        cursor=page.pagination?.[kind]?.next_cursor;
      }
      result[kind]=[...rows.values()];
    }
    return result;
  };
  return request;
}
