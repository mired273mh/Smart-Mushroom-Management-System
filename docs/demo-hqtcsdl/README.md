# Bộ9demo bảo vệ HQTCSDL

Chỉ dùng database lab mới `sm_test_*`, dữ liệu giả định có nhãn, không phải dữ liệu trại thật. Runner không drop/reset/restore đè DB. Không in URL/password; metadata/SQL vars/results/plans/log nằm trong `.local/hq-demo/run-*/`, bị Git ignore. Cần Node/dependencies +PostgreSQL local đã chạy và pg_dump/pg_restore hiện có. Không cài lại tool đã hoạt động.

```powershell
# Chạy tất cả9demo, mỗi lần tạo DB mới; không cần sửa server/.env.
node scripts/test-hqtcsdl.mjs
# Chỉ chuẩn bị DB/fixtures/50.000 mẫu để trình diễn SQL bằng tay:
node scripts/test-hqtcsdl.mjs --prepare
```

Nếu không có TEST_DATABASE_URL, runner lấy `.local/database.env` làm **connection template**, tạo DB mới, không seed vào DB template. Có thể cung cấp TEST_DATABASE_URL với prefix sm_test_ cho môi trường riêng; không dùng URL production. Account là fixture test, chỉ phục vụ lab loopback; không triển khai công khai bằng credential test.

## Chạy SQL thủ công trên Windows

Sau `--prepare`, nạp connection vào process PowerShell, không in ra màn hình:

```powershell
$lab = Get-Content .local/hq-demo/latest.json -Raw | ConvertFrom-Json
$private = Get-Content (Join-Path $lab.directory 'private.json') -Raw | ConvertFrom-Json
$labUri = [uri]$private.databaseUrl
$env:PGHOST = $labUri.Host
$env:PGPORT = if($labUri.Port -gt 0){[string]$labUri.Port}else{'5432'}
$env:PGDATABASE = $labUri.AbsolutePath.TrimStart('/')
$env:PGUSER = [uri]::UnescapeDataString($labUri.UserInfo.Split(':')[0])
$env:PGPASSWORD = [uri]::UnescapeDataString($labUri.UserInfo.Split(':',2)[1])
$psqlExe = Join-Path $env:USERPROFILE '.sm-tools/pgsql/bin/psql.exe'
$labVars = Join-Path $lab.directory 'demo-vars.sql'
& $psqlExe -X -v ON_ERROR_STOP=1 -f docs/demo-hqtcsdl/00_guard.sql -f $labVars -f docs/demo-hqtcsdl/01_schema.sql
# Thay file cuối bằng02/03/06/08/09 theo trạng thái demo.
```

Không dùng `$HOME`/biến hệ thống làm biến script. Sau khi demo: `Remove-Item Env:PGPASSWORD` để xóa secret khỏi process; đóng terminal nếu không cần tiếp. Không xóa file private/database để “reset”. Dùng --prepare tạo lab mới khi cần chạy lại các bước thay đổi trạng thái; runner kết thúc9demo đã để ledger paid và khay tranh chấp occupied nên không dùng kết quả đó làm fixture pending mới.

## Các demo và giải thích trình bày

| Demo / mục tiêu | Kiến thức và chuẩn bị / lệnh | Kết quả và bằng chứng | Khôi phục / lời giải thích ngắn |
|---|---|---|---|
|1—Thiết kế | 01_schema.sql trên lab; ERD/3NF/data dictionary ở ../THIET_KE_CSDL_HQTCSDL.md | Xuất17tables, cột/PK/FK/CHECK/UNIQUE/index; schema.json | Read-only. “Khay và hợp đồng N–N qua rental_items, mã khay unique, UUID là PK” |
|2—SQL nâng cao | 02_sql_objects.sql; có rental2khay/ledger pending/harvest |2views, tổng snapshot246000VND, CALL paid trongtransaction rồi rollback; trigger từ chối sai customer | ROLLBACK tự giữ pending. “Procedure dùng thực ở API, trigger bảo vệ SQL trực tiếp, không nhân đôi logic” |
|3—Transaction | 03_transactions.sql | COMMIT room description còn thấy, ROLLBACK không ghi đè, failed multitable booking không để orphan | Chỉ đổi phòng lab; prepare mới nếu cần dữ liệu gốc. “Lỗi bước2 rollback bước1 trong subtransaction” |
|4—Concurrency | Hai terminal cùng vars: chạy04_concurrency_a.sql rồi04_concurrency_b.sql lúcA đangsleep8s | A COMMIT; B chờ khóa rồi23505, ROLLBACK;1active owner/khay và không orphan | B lỗi là xung đột **mong đợi**, psql ON_ERROR_STOP đóng connection/rollback; interactive phải ROLLBACK. A giữ booking trong lab; prepare mới để lặp |
|5—Phân quyền | Runner tạo2login thật và chạy05_privileges.sql dưới runtime/report; còn business roles quaAPI demo8 | Runtime DML cần thiết, không DDL/schema_migrations/TRUNCATE/sửa snapshot; report chỉaggregate, SELECT users bị42501 | Runner revoke/drop đúng role tạm, DB giữ nguyên. Query tay bằng role riêng: làm theo deploy/database/README.md, không dùng owner để giả thử quyền runtime |
|6—Index/plan | 06_explain.sql;50devices×1000samples simulated, ANALYZE | EXPLAIN ANALYZE BUFFERS JSON: forcedSeq vs normal index, actual time/rows/buffers trong explain.json | SET LOCAL rollback khôi phục planner; không drop index. “So sánh có kiểm soát, không giả đây là trước/sau tối ưu production” |
|7—Backup/restore | Runner gọi node scripts/verify-backup.mjs (fixture riêng mới) | pg_dump custom→pg_restore DBmới;17table counts/graph/routines/trigger và ACL role sau restore PASS | Không overwrite nguồn; giữ dump/restoreDB. “--no-privileges bỏ ACL nên reapply routine REVOKE/grants trước dùng” |
|8—Ứng dụng→CSDL | Runner gọi REST thật rồi08_application.sql; React/Dart/Android có test riêng | Customer own200/other404/report403, Operator confirm200, SQLpaid/2items/request đúng customer | Chuỗi HTTP/SQL tự động không chứng minh UI; React E2E/Dart logs riêng, chạy demo Windows/Android để trình bày giao diện. Prepare mới để về pending |
|9—IoT data | Runner chạy iot/simulator.mjs3samples rồi09_iot.sql; códevice simulator/automation |3simulated samples, dry-run ACK, environment alert/HAVING và Customer API đọcSQL | KhôngGPIO/camera/sensor thật; lab giữhistory. “Server gán provenance; simulator không được dùng token hardware” |

Demo4 mặc địnhREAD COMMITTED: row lock điều phối, partial unique index ngăn active booking trùng kể cả SQL không có precheck API. SQLSTATE23505 là expected conflict, không phải bỏ qua testfail. Không chuyển toàn hệ thống sang SERIALIZABLE mà chưa đánh giá.

Demo5 runtime/report PostgreSQL khác role Admin/Operator/Customer trong users. Không đưa password vào SQL file hoặc lệnh -c; psql \password nhập riêng. Report views là aggregate không PII; runtime không có quyền đọc schema_migrations. Owner vẫn dùng riêng để migrate/backup.

Demo7 bằng tay: xem scripts/verify-backup.mjs và deploy/database/README.md; dùng pg_dump --format=custom --file <private.dump> rồi pg_restore --exit-on-error --no-owner --no-privileges --dbname <NEW_DB>. DBA phải tạo DB mới và reapply grants; không dùng --clean trên DB thật. Script tự động đã làm và kiểm chứng bước này trên dữ liệu fixture độc lập.

## Bằng chứng và giới hạn

SQL thủ công đã thử bằng psql trên --prepare lab, exit0. PowerShell có thể hiển thị stderr NOTICE thành NativeCommandError; NOTICE23514 trong02 là việc bị từ chối **mong đợi**, không phải SQL ERROR. Kiểm tra `$LASTEXITCODE`; không bỏ qua exit khác0. Run sau với shared PostgreSQL tools đo108.019ms/0.058ms, cho thấy biến thiên cache/tải; không lấy1số làm SLA.

Mỗi run tạo results.json có PASS/FAIL/NOT TESTED từng demo, measured explain.json và schema.json; backup/simulator có log riêng. --prepare chỉ tạo fixture, **không** ghi PASS9demo. Bản runner đầu đã chạy9/9PASS;50.000mẫu cho43.777ms forcedSeq/0.031ms normalIndex trong1lần local. Đây là số đo tại thời điểm đó, không phải SLA hoặc dự báo capacity production; hãy đọc latest results khi chạy lại.

Không gọi CLI SQL demo là React/Flutter UI PASS. Native app/demo hiện có cần schema4 trước source HQ1; đọc hướng nâng cấp/backup trong deploy/database/README.md, không tự xóa DB cũ. Các sensor/relay/camera thật vẫn chưa nghiệm thu; bảng phạm vi và giới hạn ở ../PHAM_VI_HQTCSDL.md.
