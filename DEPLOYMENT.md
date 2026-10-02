# Cloudflare 部署说明

所有命令从仓库根目录执行，使用 Node.js 22.16+。当前运行方式为 Cloudflare Workers + D1 + R2；仓库里的 Docker 配置仅作历史参考。

## 当前资源

| 用途 | 配置 |
|---|---|
| Worker | `promptnest` |
| 临时访问地址 | <https://promptnest.liuk.workers.dev> |
| 生产自定义域名 | <https://memos.quarker.cc>，已切换至 Workers |
| D1 | `promptnest`，绑定名 `DB`，数据库 ID 见 `wrangler.jsonc` |
| R2 | 复用 `memos` 桶，绑定名 `IMAGES` |
| 图片域名 | <https://bild.quarker.cc>，对应 `R2_PUBLIC_URL` |
| 前端静态资源 | `apps/web/dist`，通过 `ASSETS` 绑定部署 |

API 路径 `/api/*` 先进入 Worker，其他页面由 Workers Static Assets 提供 SPA 回退。R2 使用原生绑定，不需要给 Worker 配置 S3 Access Key 或 Secret Key。

## 本地开发

```bash
npm ci
npm run build:web
npx wrangler d1 migrations apply promptnest --local
```

在仓库根目录新建已被 Git 忽略的 `.dev.vars`，自行替换下面的占位值：

```dotenv
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="replace-with-a-long-random-password"
```

```bash
npm run dev
```

前端位于 <http://localhost:5173>，API 位于 <http://localhost:3000>；Vite 将 `/api` 请求转发到本地 Worker。D1 和 R2 的本地数据位于 `.wrangler/state/`。首次构建生成的静态资源目录供 Wrangler 启动使用。

## 发布或更新

先登录有权访问上述 Worker、D1、R2 资源的 Cloudflare 账号。首次配置或修改管理员凭据时执行：

```bash
npx wrangler login
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
```

按命令提示输入值，不把真实凭据写进源码、`wrangler.jsonc` 或终端示例命令。`.dev.vars` 只用于本地开发，生产环境使用 Worker secrets。

```bash
npm ci
npm run typecheck
npx wrangler d1 migrations apply promptnest --remote
npm run deploy
```

`npm run deploy` 会先运行 `npm run build`，再部署 Worker 和前端资源。单独运行 `npm run build` 可检查服务端类型并构建前端；`npm run check:worker` 只检查 Worker 打包。现有数据保留在 D1，日常更新不重新导入数据库。

自定义域名已切换至 Worker `promptnest`；`https://memos.quarker.cc/api/health` 返回 `hosting=cloudflare-workers`，旧服务器的 PM2 `promptnest` 进程已停止。当前账号使用 Workers Free。迁移校验确认原 SQLite 快照 SHA 一致，D1 共 217 条提示词记录，界面显示 215 条有效记录。

## 推送 main 后自动构建与部署

**状态：正在配置。** Workers Builds 连接及首次线上构建尚待验证。目标是向 [kevinlau97/promptnest](https://github.com/kevinlau97/promptnest) 的 `main` 分支推送后，自动更新 Worker `promptnest` 和 <https://memos.quarker.cc>。

| Workers Builds 设置 | 值 |
|---|---|
| 仓库 | `kevinlau97/promptnest` |
| 生产分支 | `main` |
| 根目录 | `/` |
| Build command | `npm ci --include=dev --include=optional && npm run ci:build` |
| Deploy command | `npx wrangler deploy` |
| 构建变量 `SKIP_DEPENDENCY_INSTALL` | `1` |
| Node.js | `22.23.2`，由根目录 `.node-version` 指定 |

`ci:build` 先运行认证测试，再执行包含类型检查的前后端构建。安装、测试或构建失败时不会执行部署；使用上述独立 deploy command，避免再次构建。

管理员凭据保留在 Worker 的运行时 secrets，无需复制到构建变量。D1 结构迁移仍由人工执行：涉及新迁移时，先完成备份和检查，再运行 `npx wrangler d1 migrations apply promptnest --remote`，随后部署需要该结构的代码。

## 回滚到原服务器

仅在决定恢复旧服务器时执行。若切换后 D1 已有新写入，先导出备份并处理新增数据，避免恢复旧快照后丢失这些修改。

1. 在旧服务器上运行 `/home/ubuntu/.npm-global/bin/pm2 restart promptnest`，确认原服务启动。
2. 移除 Worker 对 `memos.quarker.cc` 的自定义域名绑定，将 DNS 恢复为代理开启的 A 记录：`memos.quarker.cc → 49.51.250.18`。
3. 验证 HTTPS、登录及数据读取。仅恢复 `promptnest`，不调整其他原服务器服务。

## 从旧 SQLite 快照导入

仅在迁移到**空的目标 D1** 时执行一次。当前 `promptnest` 已有数据时，不重复运行本节导入；完整 SQL 包含建表语句和业务记录，不能直接追加到已初始化的数据库。

1. 暂停旧服务写入，或使用 SQLite 的备份接口取得一致性快照。不要只复制正在使用 WAL 的主 `.db` 文件。
2. 将快照存为本地 `backups/promptnest.snapshot.db`；这个目录已被 Git 忽略。
3. 确认 `wrangler.jsonc` 指向准备好的空目标数据库，先导入快照，再应用迁移：

```bash
python3 scripts/export-d1.py \
  backups/promptnest.snapshot.db \
  backups/promptnest.import.sql
npx wrangler d1 execute promptnest --remote --file backups/promptnest.import.sql
npx wrangler d1 migrations apply promptnest --remote
```

导出脚本会校验 SQLite 完整性，并以 `0600` 权限创建 SQL 文件；已有输出文件会报错。SQL 包含私有内容和会话数据，应保留在受限的备份目录，禁止提交 Git 或作为公开构建产物。导入后核对提示词、文件夹、图片链接和同步结果。图片仍由原有 `memos` R2 桶提供。

## 验证

```bash
npm run typecheck
npm run build
npm run check:worker
node --import tsx --test apps/server/src/auth/*.test.mjs
```

认证测试覆盖凭据比较、跨连接限流、会话生命周期、请求体限制和登录/退出流程。

完整 API 测试使用单独的本地 D1/R2 状态目录和测试凭据。先启动临时实例：

```bash
npx wrangler d1 migrations apply promptnest --local --persist-to .wrangler/integration
npx wrangler dev --local --port 3001 --persist-to .wrangler/integration \
  --var ADMIN_EMAIL:test@example.com \
  --var ADMIN_PASSWORD:local-test-password
```

另开终端运行：

```bash
TEST_ADMIN_EMAIL=test@example.com TEST_ADMIN_PASSWORD=local-test-password \
  node scripts/test-worker.mjs http://localhost:3001
```

脚本只接受本机地址，覆盖 1,000 条批量记录、同步、分享、图片上传和退出。它会软删除测试记录；测试图片和删除标记仍留在 `.wrangler/integration`。停止临时实例后，可删除该测试状态目录。不要对生产地址或保存个人数据的本地实例运行此测试。

## 登录与定时清理

管理员邮箱和密码没有默认值。Worker 从平台 secrets 读取凭据，用 Web Crypto 生成仅在请求中存在的摘要并作常量时间比较，不在数据库中保存密码或摘要。

所有登录请求先按 Cloudflare 提供的 `CF-Connecting-IP` 在 D1 中原子计数，每个固定分钟窗口最多 10 次；不会使用客户端提交的 `X-Forwarded-For`。本地没有该头的请求共用一个限流计数。会话使用随机 UUID bearer token，存于 D1，有效期 7 天。每天 UTC 03:00 的定时任务清理过期会话和旧限流记录。

## 备份与历史凭据

维护 D1 SQL 备份时可执行：

```bash
mkdir -p backups
umask 077
npx wrangler d1 export promptnest --remote --output backups/promptnest-d1-backup.sql
```

备份使用独立保管位置，并确认可恢复。D1 备份包含数据及图片引用，R2 图片对象需要单独保留；Git 仅存源码与数据库结构迁移。

当前版本已移除曾被 Git 跟踪的 `.env` 和数据库文件，但旧 Git 历史仍可能包含凭据或私有数据。文件移除不代表历史已清理，也不代表凭据已轮换；后续轮换和历史清理需单独处理。
