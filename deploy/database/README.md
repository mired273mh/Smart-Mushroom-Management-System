# Owner, runtime và report PostgreSQL

HQ2 đã chạy `node scripts/test-deployment-runtime.mjs` **PASS**: project/volume mới, provision roles/grants sau migrate, bootstrap, real sm_runtime (superuser/DDL/schema_migrations=false), Nginx/auth/query/logout. Chỉ stop stack thử nghiệm, giữ volume. Script cần cổng8080 trống, không tự dừng stack khác; private/log tại .local/hq-docker/smhq*/ không upload artifact đó lên GitHub.

Demo Windows có `node scripts/demo.mjs upgrade`: dump→restore rehearsal→migrate/counts, giữ credentials. Cập nhật sau ghi chú HQ1 bên dưới: demo đã lên schema4 ở HQ2 sau kiểm chứng; DBdev/native5432/credentials không đổi.

`grants.sql` áp dụng **sau migration004** trên database dành riêng cho Smart Mushroom, với2 role mới khác nhau do DBA tạo. Script chặn role superuser/CREATEDB/CREATEROLE/BYPASSRLS hoặc thành viên của database owner; không tạo/sửa password và không đổi pg_hba.conf. Không chạy vào database dùng chung hoặc role đang có quyền chưa được rà soát.

Trong psql bằng owner/DBA, tạo role mới (đổi tên nếu đã tồn tại, không tự ghi đè):

```sql
CREATE ROLE sm_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE sm_report LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
\password sm_runtime
\password sm_report
```

Nhập password ở prompt của psql, không ghi vào chat/source/command line. Dùng kết nối owner/migrator riêng để chạy:

```powershell
# Kết nối psql qua PGHOST/PGPORT/PGUSER/PGDATABASE và secret local/.pgpass riêng.
# PGDATABASE phải là database Smart Mushroom đã migrate, không phải postgres.
psql -X -v ON_ERROR_STOP=1 -v db_name=smart_mushroom -v runtime_role=sm_runtime -v report_role=sm_report -f deploy/database/grants.sql
```

Native: cấu hình `DATABASE_URL` của backend thành sm_runtime trong env riêng; migration vẫn dùng owner/migrator riêng qua process env. Không commit URL/password. Startup API không tự migrate. Owner sở hữu objects và chạy migration; runtime không sở hữu bảng/schema. Report chỉ đọc2view thống kê phòng/môi trường, không đọc users/password_hash/sessions/raw tenant data. Không có quyền TRUNCATE, DDL persistent hoặc đọc schema_migrations cho runtime. TEMP có thể vẫn được cấp cho PUBLIC theo mặc định PostgreSQL; không gọi đó là quyền tạo bảng trong schema public.

Runtime chỉ có UPDATE(status,completed_at) ở rentals, không sửa snapshot giá/gói/customer/thời điểm bằng SQL qua login này. SELECT FOR UPDATE vẫn dùng được vì role có quyền UPDATE trên cột của bảng. Đây là phân quyền cột thực tế; owner/migrator vẫn có quyền quản trị riêng và không dùng làm connection API production.

Backend vẫn chịu trách nhiệm xác thực/phân quyền Admin/Operator/Customer và điều kiện tenant cho từng query. Một runtime login dùng chung không tự bảo vệ tenant như RLS; DB trigger ownership chỉ bảo vệ các liên kết lịch sử và cross-table invariant, không chứng minh người gọi SQL là khách hàng nào.

**Compose mặc định hiện là profile local/dev**, API và migrator dùng DB owner; không gọi đây là profile least privilege production. Sau khi DBA provision roles trong DB/container, dùng override:

```powershell
# APP_DB_PASSWORD là secret sm_runtime (hex thuận tiện để dùng trong URL).
docker compose -f compose.yaml -f deploy/database/compose.runtime.yaml config --quiet
docker compose -f compose.yaml -f deploy/database/compose.runtime.yaml up -d --wait
```

Override không tự provision/reset role/password; API sẽ không login được nếu DBA chưa tạo đúng role/grants. Không dùng up/reset volume để “sửa” quyền. `.env` thật giữ riêng; thông số owner/migrator vẫn phục vụ dịch vụ migrate, API dùng sm_runtime.

Restore portable với `--no-owner --no-privileges` không giữ ACL. Chạy grants.sql bằng restore owner trước mở kết nối ứng dụng; script reapply REVOKE PUBLIC trên routine rồi GRANT đúng role. Test `scripts/verify-backup.mjs` đã kiểm tra lại role thật sau restore. Không restore đè dữ liệu nguồn.

Schema upgrade: backup vào file riêng, thử restore DB mới, chạy migration trên bản thử trước; nếu preflight ownership mismatch thì dừng và điều tra, không tự sửa/xóa dữ liệu. Migration004 không đổi/xóa dữ liệu và transaction rollback nếu có lỗi. Chưa áp dụng004 hoặc đổi role/credential vào DB dev/demo hiện có trong checkpoint HQ1.
