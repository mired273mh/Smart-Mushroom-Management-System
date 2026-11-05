import {z} from 'zod';
import {uuid,isoDate,limitParam} from './validation.js';
import {fail} from './errors.js';

const querySchema=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).optional(),q:z.string().trim().max(100).default(''),cursor:z.string().min(1).max(4096).optional()}).strict();
const cursorSchema=z.object({v:z.literal(1),kind:z.string(),viewer:uuid,role:z.string(),q:z.string().max(100),limit:z.number().int().min(1).max(200),key:z.string().max(2000),id:uuid}).strict();

// SQL fragments are fixed by route code, never accepted from request input.
export async function directoryPage(pool,req,{kind,select,from,id='id',order='name',search='name',timestamp=false,where='TRUE',values=[]}){
  const query=querySchema.parse(req.query),limit=limitParam(req);
  const context={v:1,kind,viewer:req.user.id,role:req.user.role,q:query.q,limit};
  let after=null;
  if(query.cursor){
    try{
      const bytes=Buffer.from(query.cursor,'base64url');if(bytes.toString('base64url')!==query.cursor)throw Error('Noncanonical cursor');
      after=cursorSchema.parse(JSON.parse(bytes.toString('utf8')));
      if(!Object.entries(context).every(([key,value])=>after[key]===value))throw Error('Wrong cursor context');
      if(timestamp)isoDate.parse(after.key);
    }catch{return fail(422,'INVALID_DIRECTORY_CURSOR','Mốc danh sách không hợp lệ; hãy tải lại trang đầu với bộ lọc hiện tại.');}
  }
  const params=[...values];
  const bind=value=>{params.push(value);return '$'+params.length;};
  const q=bind(query.q),key=bind(after?.key??null),lastId=bind(after?.id??null),cap=bind(limit+1);
  const cast=timestamp?'timestamptz':'text',direction=timestamp?'DESC':'ASC',comparison=timestamp?'<':'>';
  const cursorKey=timestamp?`to_char(${order} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`:order;
  const result=await pool.query(`SELECT ${select},${cursorKey} AS directory_cursor_key FROM ${from}
    WHERE (${where}) AND strpos(lower(${search}),lower(${q}))>0
    AND (${key}::${cast} IS NULL OR (${order},${id})${comparison}(${key}::${cast},${lastId}::uuid))
    ORDER BY ${order} ${direction},${id} ${direction} LIMIT ${cap}`,params);
  const hasMore=result.rows.length>limit,rows=result.rows.slice(0,limit),last=rows.at(-1);
  return {data:rows.map(({directory_cursor_key,...row})=>row),pagination:{limit,has_more:hasMore,next_cursor:hasMore?Buffer.from(JSON.stringify({...context,key:last.directory_cursor_key,id:last.id})).toString('base64url'):null}};
}
