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
- **CI**：push 即跑 42 項後端測試＋前端建置

## 決策 1：平台（待選定）

| 候選 | 月費 | 優點 | 注意 |
|---|---|---|---|
| **Fly.io** | 免費額度內 ~0 | 單容器部署最順、有 volume、CLI 簡單 | 免費方案機器會休眠（冷啟動延遲） |
| **Render** | 免費 web service | 設定極簡、push 自動部署 | 免費版 15 分鐘閒置休眠、無持久磁碟（要外部 DB） |
| **Oracle Cloud Free Tier** | 0（永久） | ARM VM 效能好、無休眠 | 要自管 VM/憑證/更新（运维成本最高） |
| **家用 NAS／樹莓派** | 0 | 資料完全不出家門（隱私最佳） | 內網穿透設定（Tailscale 最簡） |

> 個人健康資料的隱私考量：若重視「資料不出自己基礎設施」，NAS＋Tailscale 是零月費且最隱私的選項；若要公網隨時可用，Fly.io 起手最快。

## 決策 2：存取防護（必做，現況為零）

系統目前**無認證**——上公網前至少要一層：

- [ ] **方案 A（最快）**：平台層防護——Fly.io/Render 無內建；搭配 Cloudflare Access（免費方案可擋在源站前）或 reverse proxy（Caddy basic auth）
- [ ] **方案 B**：應用層——FastAPI 加簡單 Bearer token middleware（`HIS_API_TOKEN` 環境變數，前端帶入）；約 30 行，無外部依賴
- 建議：**M5 先做方案 B**（不依賴平台、本機/雲端一致），之後有需要再疊 A

## 決策 3：資料持久化

- [ ] **M5 最小版**：平台 volume 掛 `/app/data`＋`HIS_DB_URL=sqlite:////app/data/health_inbody.db`（docker-compose.yml 已開 volume）
- [ ] **M7 完整版**：定期 `sqlite3 .dump` 備份到物件儲存/GitHub private repo；CSV 匯出 API；hosted Postgres 遷移評估（資料量大或要多裝置寫入才需要）

## 實機測試清單（部署後）

- [ ] 手機瀏覽器：每日記錄輸入體驗（食物搜尋、公克、六大類）
- [ ] 量測輸入與趨勢圖讀取（小螢幕排版）
- [ ] 桌機日常流程：設定 → 記錄 → Dashboard 建議
- [ ] 弱網/離線行為：目前無 PWA/離線支援——記錄痛點，作為 M5 追加或 M6 前置
- [ ] 資料累積：實際使用 ≥2 週後回頭檢視 M6 的資料量是否足夠建模

## 部署步驟（平台選定後）

1. （方案 B）加 token middleware ＋ 前端帶 token → 測試綠燈
2. 平台建立 app（依所選平台文件），掛 volume、設環境變數
3. 部署、`/api/health` 驗證、seed 確認（首次啟動自動載入 2,085 項食物）
4. 手機加入主畫面書籤，開始實機測試清單
