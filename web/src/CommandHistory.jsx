import { useState } from 'react';
import { date, LoadState, Table, useData } from './components.jsx';

const labels = {
  dry_run:'Dry-run chưa xử lý', pending:'Chờ thiết bị',
  acknowledged:'Đã ACK · chưa xác minh tải', failed:'Thiết bị từ chối/lỗi', expired:'Hết hạn',
};
const actuators={mist:'Phun sương',fan:'Quạt',light:'Đèn',heater:'Sưởi'};

export default function CommandHistory({api,device,revision}) {
  const [refresh,setRefresh]=useState(0);
  const state=useData(()=>api(`/devices/${device.id}/commands?limit=100`),[api,device.id,revision,refresh],5000);
  return <section className="card">
    <div className="section-head"><h2>Lịch sử lệnh · {device.name}</h2><button className="secondary" onClick={()=>setRefresh(v=>v+1)}>Làm mới lịch sử</button></div>
    <p className="muted">100 lệnh gần nhất, cập nhật mỗi5 giây khi trang đang hiển thị. ACK chỉ là phản hồi phần mềm, chưa xác nhận tiếp điểm hoặc tải điện.</p>
    <LoadState state={state}>{rows=><Table label="Lịch sử lệnh thiết bị" rows={rows} columns={[
      {label:'Thời gian',render:c=>date(c.created_at)},
      {label:'Lệnh',render:c=>`${actuators[c.actuator]??c.actuator} · ${c.enabled?'Bật':'Tắt'} · ${c.duration_seconds}s`},
      {label:'Chế độ',render:c=>c.dry_run?'Dry-run':'Yêu cầu GPIO'},
      {label:'Nguồn',render:c=>c.source==='automatic'?'Tự động':'Thủ công'},
      {label:'Trạng thái',render:c=>labels[c.status]??c.status},
      {label:'Hết hạn lúc',render:c=>date(c.expires_at)},
      {label:'Phản hồi thiết bị',key:'result'},
    ]}/>}</LoadState>
  </section>;
}
