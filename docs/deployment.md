# 部署規劃 · Deployment Plan (M5)

> 目標：把 Health-Inbody-System 部署到雲端，開始實機日常使用。
> 本文件是 M5 的決策與執行清單——部署前逐項確認。
>
> **狀態（2026-10-29）**：三項決策**待決並凍結**，追蹤於
> [Issue #1](https://github.com/Galen-Chu/Health-Inbody-System/issues/1)；
> M5 啟動時從該 issue 勾選起手，本文件即為執行手冊。

## 現況（已就緒）

- **單容器建置**：`Dockerfile` 多階段（前端 dist → 後端 serve），`docker compose up --build` 一鍵跑
- **設定介面**：環境變數 `HIS_DB_URL`（換 DB 不改碼）、`HIS_HOST`／`HIS_PORT`
- **健康檢查**：`GET /api/health`（可接平台的監控）
- **CI**：push 即跑 67 項後端測試＋前端 lint/test/build

## 決策 1：平台（待選定）

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
- [x] **方案 B**：✅ **已實作（2026-11-06）**——FastAPI Bearer middleware（`HIS_API_TOKEN` 環境變數；`/api/health` 保持開放供平台探活；前端「設定」頁可填 token）。未設定環境變數＝本機開放模式，開發體驗不變。之後有需要再疊 A
- 建議：~~M5 先做方案 B~~（已完成）；上雲時只需在平台環境變數設定 HIS_API_TOKEN

## 決策 3：資料持久化

- [ ] **M5 最小版**：平台 volume 掛 `/app/data`＋`HIS_DB_URL=sqlite:////app/data/health_inbody.db`（docker-compose.yml 已開 volume）
- [ ] **M7 完整版**：定期 `sqlite3 .dump` 備份到物件儲存/GitHub private repo；CSV 匯出 API；hosted Postgres 遷移評估（資料量大或要多裝置寫入才需要）

## 實機測試清單（部署後）

- [ ] 手機瀏覽器：每日記錄輸入體驗（食物搜尋、公克、六大類）
- [ ] 量測輸入與趨勢圖讀取（小螢幕排版）
- [ ] 桌機日常流程：設定 → 記錄 → Dashboard 建議
- [ ] 弱網/離線行為：目前無 PWA/離線支援——記錄痛點，作為 M5 追加或 M6 前置
- [ ] 資料累積：實際使用 ≥2 週後回頭檢視 M6 的資料量是否足夠建模

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
   前端「設定」頁填入同一組 token
4. 之後 push 到 main 自動重新部署

> 注意：首次冷啟動會自動 seed 2,085 筆食物到 Postgres（約 1-2 秒）。
> Services 打包理論上會帶到 `backend/data/`，但未經實際 deploy 驗證——
> 若 API 500 且 log 顯示找不到 `foods_full.csv`，到
> [Issue #1](https://github.com/Galen-Chu/Health-Inbody-System/issues/1) 回報，
> 需在 api service 補檔案打包設定。

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

## 部署步驟（平台���定後）

1. （方案 B）加 token middleware ＋ 前端帶 token → 測試綠燈
2. 平台建立 app（依所選平台文件），掛 volume、設環境變數
3. 部署、`/api/health` 驗證、seed 確認（首次啟動自動載入 2,085 項食物）
4. 手機加入主畫面書籤，開始實機測試清單
