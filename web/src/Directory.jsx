import {useEffect,useState} from 'react';
import {LoadState,useData} from './components.jsx';

export default function Directory({api,path,revision,children,interval=0}){
  const [query,setQuery]=useState(''),[draft,setDraft]=useState(''),[cursors,setCursors]=useState([null]);
  const cursor=cursors.at(-1);
  useEffect(()=>setCursors([null]),[revision]);
  const params=new URLSearchParams({limit:'20',...(query?{q:query}:{}),...(cursor?{cursor}:{})});
  const state=useData(()=>api.page(path+'?'+params),[api,path,revision,query,cursor],interval);
  return <>
    <form className="list-filters" onSubmit={event=>{event.preventDefault();setQuery(draft.trim());setCursors([null]);}}>
      <label>Tìm trong danh sách<input aria-label="Tìm trong danh sách" maxLength={100} value={draft} onChange={event=>setDraft(event.target.value)}/></label>
      <button type="submit" className="secondary">Tìm kiếm</button>
    </form>
    <LoadState state={state}>{page=><>
      {children(page.data)}
      <nav className="pagination" aria-label="Phân trang danh sách">
        <button className="secondary" disabled={cursors.length===1} onClick={()=>setCursors(items=>items.slice(0,-1))}>Trang trước</button>
        <span role="status">Trang {cursors.length} · {page.data.length} mục</span>
        <button className="secondary" disabled={!page.pagination.has_more} onClick={()=>setCursors(items=>[...items,page.pagination.next_cursor])}>Trang sau</button>
      </nav>
    </>}</LoadState>
  </>;
}
