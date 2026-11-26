# 部署 · Deployment（N1 ✅ 已上線）

> 目標：把 Health-Inbody-System 部署到雲端，開始實機日常使用。
>
> **狀態（2026-11-25 · N1 完成並驗證）**：線上網址
> **https://health-inbody-system.vercel.app**（Vercel Services＋Neon Postgres）。
> 已驗證：`/api/health`、前端 serve、認證（cookie session 登入）、
> `foods_full.csv` 打包與 seed（2,085 項，搜尋「雞胸肉」實測）、
> 匯出/匯入、Alembic 首次標記、每日加密備份端到端。
> 桌機日常流程通；手機實機清單待補（見下方）。

## 現況（已就緒）

- **單容器建置**：`Dockerfile` 多階段（前端 dist → 後端 serve），`docker compose up --build` 一鍵跑
- **設定介面**：環境變數 `HIS_DB_URL`（換 DB 不改碼）、`HIS_HOST`／`HIS_PORT`
- **健康檢查**：`GET /api/health`（可接平台的監控）
- **CI**：push 即跑 81 項後端測試＋前端 lint/test/build

## 決策 1：平台 ✅ 已選定並上線：Vercel＋Neon

| 候選 | 月費 | 優點 | 注意 |
|---|---|---|---|
| **Vercel＋Neon**（現行首選，Galen 已有 Vercel 帳號） | 0（Hobby＋Neon free） | 前端＋FastAPI function 同平台一鍵部署；push 即發佈 | serverless 無本地磁碟——**SQLite 不持久**，資料庫改用 Neon 免費 Postgres（`HIS_DB_URL` 直接換） |
| **Fly.io** | 免費額度內 ~0 | 單容器部署最順、有 volume、CLI 簡單 | 免費方案機器會休眠（冷啟動延遲） |
| **Render** | 免費 web service | 設定極簡、push 自動部署 | 免費版 15 分鐘閒置休眠、無持久磁碟（要外部 DB） |
| **Oracle Cloud Free Tier** | 0（永久） | ARM VM 效能好、無休眠 | 要自管 VM/憑證/更新（运维成本最高） |
| **家用 NAS／樹莓派** | 0 | 資料完全不出家門（隱私最佳） | 內網穿透設定（Tailscale 最簡） |

> 個人健康資料的隱私考量：若重視「資料不出自己基礎設施」，NAS＋Tailscale 是零月費且最隱私的選項；若要公網隨時可用，Fly.io 起手最快。

## 決策 2：存取防護（必做，現況為零）

系統目前**無認證**——上公網前至少要一層：

- [ ] **方案 A（最快）**：平台層防護——Fly.io/Render 無內建；搭配 Cloudflare Access（免費方案可擋在源站前）或 reverse proxy（Caddy basic auth）
- [x] **方案 B**：✅ **已實作（2026-11-06，2026-11-25 強化）**——認證走 Bearer header **或** `his_session` cookie（`/api/auth/login` 核發，HttpOnly、效期一年；常數時間比對 `secrets.compare_digest`；`/api/health` 保持開放供平台探活）。前端「設定」頁登入一次即可，token 由 cookie 保存、不依賴 localStorage。未設定環境變數＝本機開放模式，開發體驗不變。之後有需要再疊 A
- 建議：上雲時在平台環境變數設定 `HIS_API_TOKEN`，使用者到設定頁**登入一次**即可（cookie 保存一年）

## 決策 3：資料持久化

- [x] **N1（Vercel 路線）**：改用 Neon Postgres（`HIS_DB_URL` 直換），無 volume 需求
- [ ] **M5 最小版（Docker 路線）**：平台 volume 掛 `/app/data`＋`HIS_DB_URL=sqlite:////app/data/health_inbody.db`（docker-compose.yml 已開 volume）
- [x] **匯出／匯出 API**（2026-11-25）：`GET /api/export`（JSON 單檔／CSV ZIP）＋ `POST /api/import`（merge／replace 還原）——設定頁有下載與匯入 UI
- [x] **N2 完整版**（2026-11-25）：
  - Alembic 遷移已接入——`init_db` 冷啟動自動處理（既有 Neon 庫首次會 stamp head，之後 upgrade）
  - 自動備份已就緒：`.github/workflows/backup.yml` 每日排程，匯出後 **AES-256 加密**才進本 repo（個人健康紀錄不落明文；設定兩個 secrets 即啟用——見 [backup.md](backup.md)）

## 實機測試清單（部署後）

- [ ] 手機瀏覽器：每日記錄輸入體驗（食物搜尋、公克、六大類）
- [ ] 量測輸入與趨勢圖讀取（小螢幕排版）
- [x] 桌機日常流程：設定 → 記錄 → Dashboard 建議（2026-11-25 驗證）
- [x] 弱網/離線行為（2026-11-26，N3）：寫入操作離線排隊＋連線自動重送（頂部橫幅顯示狀態）；PWA 可安裝
- [ ] 資料累積：實際使用 ≥2 週後回頭檢視 N4 的資料量是否足夠建模（2026-12-09 起）

## Vercel＋Neon 部署步驟（repo 已備妥設定檔）

`vercel.json` 採 Vercel **Services** 格式（beta，單一專案一次部署前後端、
同一網域）：`web`＝`frontend/`（Vite 靜態輸出）、`api`＝`backend/`
（FastAPI，entrypoint `app.main:app`）；頂層 rewrites 把 `/api/*` 交給後端
service，其餘路徑交給前端 service。Python 依賴由 `backend/requirements.txt`
安裝（已含 psycopg，Neon 連線用）。

### 路徑一：網頁 UI

1. **Neon**：[neon.tech](https://neon.tech) 免費註冊 → 建立 Project →
   複製連線字串（`postgresql+psycopg://…`，注意 schema 前綴要 `+psycopg`）
2. **Vercel**：Add New… → Project → Import `Health-Inbody-System` →
   Environment Variables 設定：
   - `HIS_DB_URL`＝Neon 連線字串
   - `HIS_API_TOKEN`＝自訂強 token（方案 B 已實作）
3. 頁面最底部 **Deploy** → 完成後開 `<網址>/api/health` 驗證 →
   前端「設定」頁用同一組 token **登入**（cookie session）
4. 之後 push 到 main 自動重新部署

> ✅ 打包疑慮已排除（2026-11-25 實測）：Services 會帶到 `backend/data/`，
> 首次冷啟動自動 seed 2,085 筆食物到 Postgres，搜尋正常。

### 路徑二：CLI 部署（在 PowerShell 依序執行）

```powershell
# 1. 安裝 CLI（一次性）
npm i -g vercel

# 2. 進到專案目錄
cd D:\Health-Inbody-System

# 3. 登入（會開瀏覽器按確認）
vercel login

# 4. 建立並連結專案（問題全部按 Enter 採預設；它會抓到 vercel.json 的設定）
vercel link

# 5. 設定兩個環境變數（各會提示你貼值）
vercel env add HIS_DB_URL production
#   → 貼 Neon 連線字串，前綴改 postgresql+psycopg://

vercel env add HIS_API_TOKEN production
#   → 貼自訂 token

# 6. 正式部署
vercel --prod
```

兩條路徑擇一即可，結果相同；CLI 部署完終端機會印出網址，
驗證方式同路徑一步驟 3。

## 疑難排解紀錄（2026-11-25 部署日歸檔）

首次上線當天踩過的坑，留檔備查：

1. **環境變數改了沒生效**——Vercel 環境變數只在**部署時**注入；
   改完必須 Redeploy（Deployments → 最新一筆 ⋯ → Redeploy）。
   另注意同名變數可能因範圍（Production/Preview/Development）有多筆。
2. **「token 跑掉」的真相**——token/cookie 跟著**網址（origin）**走：
   主網域 `health-inbody-system.vercel.app` 與 Vercel 後台點開的
   「部署網址」（`…-<hash>-<scope>.vercel.app`）是不同站、不共用儲存。
   一律從主網域進（設定頁會顯示目前 origin 提醒）。
   此痛點促成了 cookie session 登入（登入一次保存一年）。
3. **間歇性 500**——Neon 免費版閒置休眠，冷喚醒期間的 stale connection
   會讓第一個請求 500（觀察到 `/api/metrics`）。已加 `pool_pre_ping`
   防護；若再現，到 Deployments → 最新一筆 → **Logs** 抓 Python traceback。
4. **看錯誤的方法**——Vercel → 專案 → Deployments → 點最新部署 → Logs
   分頁，重整 app 觸發錯誤後會出現完整 traceback。