import { z } from 'zod';
export const uuid = z.uuid();
export const name = z.string().trim().min(1).max(100);
export const password = z.string().min(12).max(128);
export const email = z.email().max(254).transform(s => s.toLowerCase());
export const idParam = req => uuid.parse(req.params.id);
export const limitParam = (req, max = 200) => z.coerce.number().int().min(1).max(max).default(Math.min(100, max)).parse(req.query.limit);
export const isoDate = z.iso.datetime({ offset: true });
export const stages = ['incubation', 'fruiting', 'ready', 'harvested'];
