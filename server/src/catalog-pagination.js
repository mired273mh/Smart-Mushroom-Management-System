import {z} from 'zod';
import {uuid,limitParam} from './validation.js';
import {fail} from './errors.js';
const querySchema=z.object({
  limit:z.string().regex(/^[1-9]\d{0,2}$/).optional(),
  tray_q:z.string().trim().max(100).default(''),plan_q:z.string().trim().max(100).default(''),
  room_id:uuid.optional(),tray_cursor:z.string().min(1).max(4096).optional(),plan_cursor:z.string().min(1).max(4096).optional(),
}).strict();
const common={v:z.literal(1),viewer:uuid,limit:z.number().int().min(1).max(200),search:z.string().max(100),room_id:uuid.nullable()};
const cursorSchema=z.discriminatedUnion('kind',[
  z.object({...common,kind:z.literal('trays'),after:z.object({code:z.string().max(2000)}).strict()}).strict(),
  z.object({...common,kind:z.literal('plans'),after:z.object({price_vnd:z.number().int().min(0).max(1_000_000_000),id:uuid}).strict()}).strict(),
]);
export function catalogInput(req){
  const query=querySchema.parse(req.query),limit=limitParam(req),after={plans:null,trays:null};
  const context=kind=>({v:1,viewer:req.user.id,limit,search:kind==='trays'?query.tray_q:query.plan_q,room_id:kind==='trays'?(query.room_id??null):null,kind});
  for(const kind of ['plans','trays']){
    const encoded=query[kind==='trays'?'tray_cursor':'plan_cursor'];if(!encoded)continue;
    try{
      const bytes=Buffer.from(encoded,'base64url');if(bytes.toString('base64url')!==encoded)throw Error('Noncanonical cursor');
      const parsed=cursorSchema.parse(JSON.parse(bytes.toString('utf8'))),expected=context(kind);
      if(!Object.entries(expected).every(([key,value])=>parsed[key]===value))throw Error('Wrong cursor scope');
      after[kind]=parsed.after;
    }catch{return fail(422,'INVALID_CATALOG_CURSOR','Mốc catalog không hợp lệ; tải lại trang đầu với bộ lọc hiện tại.');}
  }
  return {query,limit,after,context};
}
export function catalogPage(rows,input,kind){
  const hasMore=rows.length>input.limit,page=rows.slice(0,input.limit),last=page.at(-1);
  const after=last?(kind==='trays'?{code:last.code}:{price_vnd:last.price_vnd,id:last.id}):null;
  return {rows:page,pagination:{limit:input.limit,has_more:hasMore,next_cursor:hasMore?Buffer.from(JSON.stringify({...input.context(kind),after})).toString('base64url'):null}};
}
