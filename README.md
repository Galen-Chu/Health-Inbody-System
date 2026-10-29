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

**進行中與下一步 · Next（2026-10 起的優先序）**

- [ ] **M5 雲端部署＋實機測試**（優先序 1）——詳見 [docs/deployment.md](docs/deployment.md)
  - Docker 單容器上雲（候選平台與取捨已列）；個人健康資料上雲的存取防護；資料卷持久化（最小版）
  - 實機測試：手機／桌機瀏覽器日常使用、行動輸入體驗、離線容忍
- [ ] **M6 ML 預測分析**（優先序 2）
  - 前置：實機使用累積量測與飲食紀錄（M5 產生的真實資料）
  - 候選題目：體重/體脂趨勢預測（先指數平滑/回歸，後梯度提升）、六大類缺口 × 歷史飲食的「適合食物」推薦（原專題簡報 p21 願景）
  - 介面：沿用 `/api/recommendations` 型別輸出，模型在 `engine/` 背後熱插換
- [ ] **M7 每日資料儲存機制**（優先序 3）
  - 備份與匯出：SQLite 定期 dump、CSV/JSON 匯出（量測＋飲食歷史）
  - 持久化升級：資料卷 → hosted Postgres 的決策與遷移路徑
  - 資料保留與裝置換機：一鍵匯入匯出

> 相依性：M5 最小持久化（資料卷）先行，M7 才做完整備份/遷移；M6 依賴 M5 累積的真實資料。

## 📄 Sources · 資料來源

- 國民飲食指南手冊（2018）· 衛福部國民健康署
- 食品營養成分資料庫 · 衛福部食品藥物管理署
- 原專題：國人食品成份資料集初探（2024，商業大數據分析人才養成班）

## 📄 License

MIT — see [LICENSE](LICENSE).
