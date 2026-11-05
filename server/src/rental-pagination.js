import { z } from 'zod';
import { uuid, isoDate, limitParam } from './validation.js';
import { fail } from './errors.js';

const querySchema = z.object({
  limit: z.string().regex(/^[1-9]\d{0,2}$/).optional(),
  cursor: z.string().min(1).max(1024).optional(),
  status: z.enum(['active','completed']).optional(),
  customer_id: uuid.optional(),
}).strict();
const cursorSchema = z.object({
  v: z.literal(1), starts_at: isoDate, id: uuid, viewer: uuid,
  status: z.enum(['active','completed']).nullable(), customer_id: uuid.nullable(),
}).strict();

export function rentalPageInput(req) {
  const query = querySchema.parse(req.query);
  const limit = limitParam(req);
  if (req.user.role === 'customer' && query.customer_id) return fail(403, 'FORBIDDEN', 'Khách chỉ được xem lịch sử thuê của mình.');
  let cursor = null;
  if (query.cursor) {
    try {
      const bytes = Buffer.from(query.cursor, 'base64url');
      if (bytes.toString('base64url') !== query.cursor) throw new Error('Noncanonical cursor');
      cursor = cursorSchema.parse(JSON.parse(bytes.toString('utf8')));
      if (cursor.viewer !== req.user.id || cursor.status !== (query.status ?? null) || cursor.customer_id !== (query.customer_id ?? null)) throw new Error('Cursor scope mismatch');
    } catch { return fail(422, 'INVALID_CURSOR', 'Mốc phân trang không hợp lệ; hãy tải lại trang đầu với bộ lọc hiện tại.'); }
  }
  return { limit, status: query.status ?? null, customerId: query.customer_id ?? null, cursor };
}

export function rentalPageResponse(rows, input, user) {
  const hasMore = rows.length > input.limit;
  const page = rows.slice(0, input.limit);
  const last = page.at(-1);
  const cursor = hasMore ? Buffer.from(JSON.stringify({
    v:1, starts_at:last.cursor_started_at, id:last.id, viewer:user.id,
    status:input.status, customer_id:input.customerId,
  })).toString('base64url') : null;
  return {
    data:page.map(({ cursor_started_at, ...row }) => row),
    pagination:{ limit:input.limit, has_more:hasMore, next_cursor:cursor },
  };
}
