# 自動備份設定 · Automated Backup（N2）

> 主 repo（Health-Inbody-System）是**公開**的——個人健康資料不能 commit 進去。
> 備份因此推送到**另一個私有 repo**，由它自己的 GitHub Actions 排程執行，
> 用 repo 內建的 GITHUB_TOKEN 推送（**不需要**建立 PAT）。

## 運作方式

- 每天**台灣時間 05:17**（UTC 21:17）執行，也可隨時手動觸發
- 呼叫線上 `GET /api/export?format=json`（帶 `HIS_API_TOKEN` Bearer 認證）
- 全量備份（profile／量測／餐點／每日記錄）commit 到私有 repo 的 `backups/`
- 自動清理 180 天前的舊檔；資料沒變的日子不產生空 commit
- 還原：備份檔就是「設定 → 資料匯入」吃的格式，直接匯回即可

## 一次性設定（三分鐘，只做一次）

### 1. 建立私有 repo

GitHub 右上角 `+` → **New repository**：

- Repository name：`Health-Inbody-System-backup`（可自訂）
- 選 **Private**（務必確認）
- 勾 **Add a README file**（repo 要有初始 commit 才能推送）
- **Create repository**

### 2. 加入 workflow 檔

在新 repo 頁面：**Add file → Create new file**，檔名填：

```
.github/workflows/backup.yml
```

內容貼上以下整段（`API_BASE` 已填好線上網址）：

```yaml
name: Daily Backup

on:
  schedule:
    - cron: "17 21 * * *"   # UTC 21:17 ＝ 台灣每天 05:17
  workflow_dispatch:          # Actions 分頁可手動觸發

permissions:
  contents: write

concurrency:
  group: backup
  cancel-in-progress: false

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Prune backups older than 180 days
        run: find backups -name 'his_export_*.json' -mtime +180 -delete || true

      - name: Pull export from production
        env:
          API_BASE: https://health-inbody-system.vercel.app
          HIS_API_TOKEN: ${{ secrets.HIS_API_TOKEN }}
        run: |
          mkdir -p backups
          curl -sf -H "Authorization: Bearer $HIS_API_TOKEN" \
            "$API_BASE/api/export?format=json" -o "backups/his_export_$(date -u +%F).json"
          ls -la backups/

      - name: Commit and push
        run: |
          git config user.name "backup-bot"
          git config user.email "backup-bot@users.noreply.github.com"
          git add backups
          if git diff --cached --quiet; then
            echo "No changes since last backup."
          else
            git commit -m "backup: $(date -u +%F)"
            git push
          fi
```

→ **Commit changes**。

### 3. 加入 secret

新 repo → **Settings → Secrets and variables → Actions → New repository secret**：

- Name：`HIS_API_TOKEN`
- Secret：跟 Vercel 環境變數 `HIS_API_TOKEN` **同一組值**

### 4. 驗證

**Actions** 分頁 → 左側 `Daily Backup` → **Run workflow** → 跑完後 repo 出現
`backups/his_export_YYYY-MM-DD.json` 即成功。之後每天自動執行。

## 補充

- 想改備份時間：調 `cron`（UTC 時間，台灣 −8 小時）
- 通知：repo **Settings → Notifications** 或 GitHub 帳號的 Actions 失敗通知，
  預設 workflow 失敗會寄信到帳號信箱
- 這份說明的正本在此；workflow 檔以私有 repo 內的為準
