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
- **食物資料**：`backend/data/foods_sample.csv` 為樣本；完整資料庫待 M2 從[食藥署食品營養成分資料庫](https://consumer.fda.gov.tw/Food/TFND.aspx)匯入

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

## 🗺️ Roadmap · 里程碑

- [x] **M1 引擎層**：BMR/TDEE/六大類/水分公式＋23 項測試
- [x] **M2a 骨架**：FastAPI CRUD＋SQLite＋React 前端三頁＋六邊形圖
- [ ] **M2b 食物資料庫**：食藥署完整資料 CSV 匯入＋搜尋 API＋熱量自動加總
- [ ] **M3 趨勢可視化**：體重/體脂/肌肉量趨勢圖（接圖表庫）
- [ ] **M4 建議引擎**：TDEE 差額 × 六大類達成率的規則建議（預留 ML：預測適合的食物種類——原專題簡報 p21 的願景）

## 📄 Sources · 資料來源

- 國民飲食指南手冊（2018）· 衛福部國民健康署
- 食品營養成分資料庫 · 衛福部食品藥物管理署
- 原專題：國人食品成份資料集初探（2024，商業大數據分析人才養成班）

## 📄 License

MIT — see [LICENSE](LICENSE).
