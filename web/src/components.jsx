import { useEffect, useMemo, useState } from 'react';
export const date = value => value ? new Date(value).toLocaleString('vi-VN') : '—';
export const money = value => Number(value ?? 0).toLocaleString('vi-VN') + ' ₫';
export const statusLabels = { active: 'Đang thuê', completed: 'Hoàn tất', available: 'Sẵn sàng', maintenance: 'Bảo trì', retired: 'Ngừng dùng', incubation: 'Ủ phôi', fruiting: 'Ra quả thể', ready: 'Sẵn sàng thu hoạch', harvested: 'Đã thu hoạch', pending: 'Chờ xác nhận', paid: 'Đã thu', requested: 'Mới yêu cầu', processing: 'Đang xử lý', cancelled: 'Đã hủy', admin: 'Quản trị viên', operator: 'Vận hành', customer: 'Khách hàng', simulator: 'Mô phỏng', hardware: 'Phần cứng', pickup: 'Nhận tại trại', delivery: 'Giao hàng' };
export const Badge = ({ value }) => <span className={`badge ${value}`}>{statusLabels[value] ?? value}</span>;

export function useData(load, dependencies, interval = 0) {
  const scope = useMemo(() => ({}), dependencies);
  const [state, setState] = useState({ data: null, error: '', loading: true });
  useEffect(() => {
    let alive = true;
    const run = async () => {
      try { const data = await load(); if (alive) setState({ scope, data, error: '', loading: false }); }
      catch (error) { if (alive) setState(s => ({ ...s, error: error.message, loading: false })); }
    };
    setState({ scope, data: null, error: '', loading: true });
    run();
    const timer = interval ? setInterval(() => { if (!document.hidden) run(); }, interval) : null;
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [scope]);
  // Hide data from the previous query during render, before effects execute.
  return state.scope === scope ? state : { data:null, error:'', loading:true };
}
export function LoadState({ state, children }) {
  if (state.loading) return <p className="empty" role="status">Đang tải dữ liệu…</p>;
  return <>{state.error && <p className="error" role="alert">{state.error}</p>}{state.data !== null && children(state.data)}</>;
}
export function Table({ columns, rows, label = 'Dữ liệu' }) {
  if (!rows.length) return <p className="empty">Chưa có dữ liệu.</p>;
  return <div className="table-wrap"><table aria-label={label}><thead><tr>{columns.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id ?? i} data-record-id={row.id}>{columns.map(c => <td key={c.label}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}
export function Modal({ title, close, children }) {
  useEffect(() => {
    const previous = document.activeElement;
    const handler = event => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-label={title} className="modal"><div className="section-head"><h2>{title}</h2><button type="button" className="secondary" onClick={close} aria-label="Đóng">×</button></div>{children}</section></div>;
}
export function Form({ fields, initial = {}, submit, submitLabel = 'Lưu', onDone }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget), data = {};
    for (const field of fields) {
      const raw = field.type === 'multi' ? form.getAll(field.key) : form.get(field.key);
      if (field.optional && (field.omitEmpty || field.type === 'password' || field.type === 'datetime-local') && (raw === '' || raw === null)) continue;
      data[field.key] = field.type === 'number' ? Number(raw) : field.type === 'checkbox' ? raw === 'on' : field.type === 'datetime-local' ? (raw ? new Date(raw).toISOString() : null) : raw;
    }
    try { const result = await submit(data); onDone?.(result); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <form className="form" onSubmit={save}>{fields.map(field => <label key={field.key}>{field.label}{field.type === 'select' || field.type === 'multi' ?
    <select aria-label={field.label} name={field.key} multiple={field.type === 'multi'} required={!field.optional} defaultValue={initial[field.key] ?? (field.type === 'multi' ? [] : '')}>{field.type !== 'multi' && <option value="">Chọn…</option>}{field.choices.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select> : field.type === 'checkbox' ?
    <input aria-label={field.label} type="checkbox" name={field.key} defaultChecked={initial[field.key] ?? false}/> :
    <input aria-label={field.label} autoFocus={field === fields[0]} name={field.key} type={field.type ?? 'text'} required={!field.optional} min={field.min} max={field.max} minLength={field.minLength} maxLength={field.maxLength ?? 2000} defaultValue={initial[field.key] ?? ''} autoComplete={field.type === 'password' ? 'new-password' : undefined}/>
  }{field.hint && <small>{field.hint}</small>}</label>)}{error && <p className="error" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : submitLabel}</button></form>;
}
