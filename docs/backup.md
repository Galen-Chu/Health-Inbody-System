# 自動備份 · Automated Backup（N2）

> 備份內容＝**個人健康紀錄**（profile／量測／飲食日記／每日備註）。
> 本 repo 為公開，因此備份檔以 **AES-256 加密**後才 commit——公開看得到
> 檔案，內容是密文；金鑰只存在 GitHub secrets，永遠不進 repo。
> （食物資料庫 `foods_full.csv` 是 opendata，本來就直接放在 repo。）

## 運作方式

- Workflow：[`.github/workflows/backup.yml`](../.github/workflows/backup.yml)
- 每天**台灣時間 05:17**（UTC 21:17）執行，也可隨時手動觸發
- 拉線上 `GET /api/export?format=json`（Bearer 認證）→ openssl AES-256 加密
  → commit 到 `backups/his_backup_YYYY-MM-DD.json.enc`
- 每天一份快照（可還原到過去任一天的狀態）；自動清理 180 天前舊檔

## 一次性設定（兩分鐘，只做一次）

需要在本 repo 加 **兩個 secrets**：

1. GitHub → `Health-Inbody-System` → **Settings → Secrets and variables → Actions
   → New repository secret**：
   - Name：`HIS_API_TOKEN`｜Secret：跟 Vercel 環境變數**同一組值**
2. 再 New repository secret 一次：
   - Name：`BACKUP_KEY`｜Secret：下面這行 PowerShell 產生的值
     （會放進剪貼簿，直接貼上）：

   ```powershell
   $b=[byte[]]::new(32); [System.Security.Cryptography.RandomNumberGenerator]::Fill($b); [Convert]::ToBase64String($b) | Set-Clipboard
   ```

   ⚠ **BACKUP_KEY 請自己另外記一份**（密碼管理員等）——它不在 repo 裡，
   遺失＝舊備份全部解不開（屆時仍可從當時的線上資料重新備份）。

3. 驗證：**Actions** 分頁 → 左側 `Daily Backup` → **Run workflow** →
   跑完後 repo 出現 `backups/his_backup_日期.json.enc` 即成功。

## 還原流程（需要時）

```powershell
# 1. 在 Git Bash 解密（BACKUP_KEY 的值）：
export BACKUP_KEY='貼上金鑰'
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in backups/his_backup_2026-11-25.json.enc \
  -out his_export.json -pass env:BACKUP_KEY

# 2. 開 app → 設定 → 資料匯入 → 選 his_export.json（合併或取代）
```

PowerShell 用戶也可直接用 Git 內附的 openssl：
`& "C:\Program Files\Git\usr\bin\openssl.exe" enc -d -aes-256-cbc -pbkdf2 -in <檔案> -out his_export.json -pass env:BACKUP_KEY`

## 調整

- 備份時間：改 workflow 裡的 `cron`（UTC，台灣 −8 小時）
- 保留天數：改 `Prune backups older than 180 days` 那行的數字
- 失敗通知：GitHub 帳號預設會對 workflow 失敗寄信
