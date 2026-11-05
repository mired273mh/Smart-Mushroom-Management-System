import { z } from 'zod';

export class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export const fail = (status, code, message) => { throw new HttpError(status, code, message); };
export const notFound = () => fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu hoặc không có quyền truy cập.');
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof z.ZodError) return res.status(422).json({ error: { code: 'VALIDATION', message: 'Dữ liệu không hợp lệ.', fields: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } });
  if (['23505','23503','23514','23P01'].includes(error.code)) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Dữ liệu trùng, đang được sử dụng hoặc vi phạm ràng buộc.' } });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON không hợp lệ.' } });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: { code: 'TOO_LARGE', message: 'Nội dung quá lớn.' } });
  if (!error.status) console.error('Unhandled API error:', error.code ?? error.name);
  return res.status(error.status ?? 500).json({ error: { code: error.status ? error.code : 'INTERNAL_ERROR', message: error.status ? error.message : 'Lỗi máy chủ.' } });
}
