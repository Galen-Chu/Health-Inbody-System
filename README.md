# 🩺 Health-Inbody-System

> **"Measure, visualize, adjust."** · 「量測、視覺化、調整。」

Web rewrite of the 2024 tkinter side project（[ZZZChing-Wen-s-Side-Project](https://github.com/Galen-Chu/ZZZChing-Wen-s-Side-Project)）— an interactive nutrition & body-composition tool built on Taiwan's food composition dataset.

---

## 🧭 What It Does · 功能

- **Body metrics** · 身體組成量測記錄（體重/體脂/肌肉量，InBody 風格趨勢）
- **BMR / TDEE engine** · 有體脂走 Katch-McArdle，無體脂自動退回 Mifflin-St Jeor；活動量×目標（減脂/維持/增肌）算出每日熱量
- **Six food groups** · 六大類食物份量（國民飲食指南 2018 熱量階梯），互動六邊形雷達圖顯示達成率
- **Water tracking** · 每日飲水目標（35 ml/kg）＋記錄
- **Daily log** · 每日六大類份量＋飲水＋備註，同日 upsert
- **Data portability** · 全量匯出（JSON／CSV ZIP）與匯入還原（同日合併／整檔取代）

## 🏗️ Architecture · 架構

```
frontend (React + Vite)          backend (FastAPI + SQLAlchemy)
  Dashboard 六邊形/趨勢    /api   engine/  純函式引擎（BMR/TDEE/六大類/水分）
  DailyLog  每日記錄      ─────▶  routers/ profile/records/metrics/body-metrics
  Settings  個人設定              db/      SQLite（環境變數可換上雲 DB）
```

- **引擎與介面分離**：`backend/app/engine/` 是純 Python 函式＋pytest 單元測試（數值基準來自原專案公式手算）
- **本機先行、預留上雲**：預設 SQLite＋uvicorn；`Dockerfile` 多階段建置（前端 dist 由後端直接 serve，單容器即可部署）
- **食物資料**：`backend/data/foods_full.csv`（2,085 項，食藥署開放資料轉製）隨 repo 附上，首次啟動自動載入；重製流程：`scripts/transform_fda_csv.py`（原始長格式→schema）→ `scripts/import_foods.py`

## 🚀 Quick Start · 快速開始

```bash
# 後端（API + SQLite）
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload        # http://127.0.0.1:8000/docs

# 前端（開發熱重載，/api 自動代理到 8000）
cd frontend
npm install && npm run dev           # http://localhost:5173

# 或單容器跑整套（本機需 Docker）
docker compose up --build
```

## ✅ Tests · 測試

```bash
cd backend && python -m pytest       # 引擎公式數值基準 + API 煙霧測試
```

CI（`.github/workflows/ci.yml`）每次 push/PR 跑後端 pytest ＋前端 `npm run build`。

## 🗺️ Roadmap · 開發優先序

**已完成 · Completed**

- [x] **M1 引擎層**：BMR/TDEE/六大類/水分公式＋數值基準測試
- [x] **M2a 骨架**：FastAPI CRUD＋SQLite＋React 前端＋六邊形圖
- [x] **M2b 食物資料庫**：食藥署 2,085 項食物（[政府開放資料](https://scidm.nchc.org.tw/dataset/best_wish8543)樞紐轉製）、搜尋 API、餐點×公克自動換算、每日彙總、首次啟動自動 seed
- [x] **M3 趨勢可視化**：小倍數三圖（體重/體脂/肌肉量）、十字線 tooltip、`#hash` 深連結分頁
- [x] **M4 建議引擎**：五條雙語規則（熱量平衡/水分缺口/蛋白質下限 1.0g/kg/六大類缺口前兩名/正向回饋）——`/api/recommendations/{日}`
- [x] **M4.5 上雲前置**（2026-11）：認證——Bearer token＋cookie session（`HIS_API_TOKEN`；設定頁登入一次，瀏覽器記住一年）；前端改版 Uniconsign 設計系統（深色模式）；`vercel.json` → Vercel Services 格式（前後端同域一次部署）
- [x] **M6 前置**：Holt 線性外推——體重/體脂/肌肉量三指標預測（`/trend/weight?metric=`）
- [x] **M7 前置**（2026-11-25）：全量匯出 `/api/export`（JSON 單檔／CSV ZIP）；**匯入還原 `/api/import`**（merge＝同日合併／replace＝整檔取代，冪等）；P0 修正——本地時區「今天」、食物搜尋 `ILIKE`（SQLite/Postgres 行為一致）、常數時間 token 比對
- [x] **N1 部署落地**（原 M5，2026-11-25）：Vercel Services＋Neon Postgres 上線（https://health-inbody-system.vercel.app）——health／前端／認證／seed（2,085 項）全驗證；部署日除錯歸檔於 [docs/deployment.md](docs/deployment.md) 疑難排解紀錄
- [x] **N1.5 認證升級**（2026-11-25，部署日痛點促成）：cookie session 登入（`/api/auth/login` 核發 HttpOnly cookie、效期一年，設定頁登入一次）＋ Bearer 並行；冷啟動防護 `pool_pre_ping`
- [x] **N2 資料安全完備**（原 M7 剩餘，2026-11-25）：Alembic 遷移接入（`init_db` 版本感知；改 schema 走 `python -m alembic revision --autogenerate`）；每日自動備份——AES-256 加密快照進本 repo `backups/`（180 天保留，[docs/backup.md](docs/backup.md)），已端到端驗證
- [x] **N3 行動體驗** ✅ **完成（2026-11-26）**：
  - [x] **PWA 安裝**：manifest＋品牌圖示（192/512 maskable＋iOS touch icon）——手機「加到主畫面」即獨立視窗 app
  - [x] **份量速選**：選食物後出現「½/1/2 碗（份/杯/茶匙）」按鈕，公克自動帶入（單位與六大類估算同源，`GET /api/six-groups/units`）
  - [x] **刪除型 API＋UI**：`DELETE /records/{日}`、`DELETE /body-metrics/{日}`——每日記錄與趨勢歷史可刪錯誤資料
  - [x] **餐點時段＋行內編輯**：新增餐點可選早/午/晚/點心；表格內 ✎ 直接改公克（營養快照等比換算，`PATCH /meals/{id}`）與時段
  - [x] **Dashboard 快捷飲水**：+250/+500 ml 一鍵記錄（同日 upsert，保留六大類與備註）
  - [x] **離線容忍**：寫入操作離線/斷網時進本機佇列（頂部橫幅顯示待同步筆數），恢復連線自動重送——records/量測為冪等 upsert、餐點依序附加，重送安全
  - [x] **bundle 瘦身**：主題 icon 42KB→1KB；**API 健壯性**：個人資料未填齊時 summary/recommendations 回明確 422

**進行中與下一步 · Next**

- [ ] **N4 ML 預測分析**（原 M6）：等線上累積 ≥2 週真實資料（2026-12-09 起）；Holt 先加預測區間，後考慮回歸／梯度提升（介面沿用 `/api/recommendations` 型別，模型在 `engine/` 背後熱插換）
- 資料源補充按功能需求拉：微量營養（食藥署原始檔欄位擴充＋DRIs）、條碼掃描（Open Food Facts）、裝置整合（實測活動量校正 TDEE）

> N1/N2（2026-11-25）、N3（2026-11-26）已收工；下一步＝日常使用累積資料，N4 等 2026-12-09 資料期滿。

## 📄 Sources · 資料來源

- 國民飲食指南手冊（2018）· 衛福部國民健康署
- 食品營養成分資料庫 · 衛福部食品藥物管理署
- 原專題：國人食品成份資料集初探（2024，商業大數據分析人才養成班）

## 📄 License

MIT — see [LICENSE](LICENSE).
