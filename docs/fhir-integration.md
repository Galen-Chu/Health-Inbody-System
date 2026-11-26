# FHIR 介接與 HIS 導入 · 構想評估（2026-11-26 歸檔，暫緩開發）

> 評估結論：**FHIR 作為對外匯出介面值得做**（階段 1，約一天工作量）；
> **內部模型 FHIR 化與醫院 HIS 產品導入現階段不建議**——後者的門檻是
> 制度與法規（醫院採購、資安稽核、SaMD），不是技術。本文完整歸檔評估
> 內容，供未來開發時直接取用，不需重新推導。

## 一、資料對映（現有 schema ↔ FHIR R4）

| 內部資料 | FHIR 資源 | 對映品質與備註 |
|---|---|---|
| `Profile`（sex/height/age/name） | `Patient` | 良好；**缺口：FHIR 要 `birthDate`，內部只存 `age`，無法反向推算**——開發前需加欄位（Alembic migration） |
| `BodyMetric.weight_kg` | `Observation` | LOINC `29463-7`（Body weight）＋ UCUM `kg`——教科書級對映 |
| `BodyMetric.body_fat_pct` | `Observation` | 可行；LOINC 身體組成代碼需查證選定（注意「量測 vs 估算」語義） |
| `BodyMetric.muscle_mass_kg` | `Observation` | 同上 |
| `DailyRecord.water_ml` | `Observation` | fluid intake |
| `MealEntry`（食物×公克×營養） | `NutritionIntake` | ⚠ 僅 **R5** 有此資源；R4 下用自訂 extension 先撐，或提供 R4/R5 雙版本輸出 |
| 六大類份量（`servings`） | extension | 台灣特有概念（國民飲食指南 2018），無標準資源 |
| `goal`（cut/maintain/bulk） | `Goal` | 良好 |
| BMR/TDEE/建議（引擎派生值） | — | 不建議對映：HIS 不需要派生值，重算即可 |

**版本選擇：R4**——台灣次世代 HIS（NGHIS）與多數醫院 FHIR 伺服器走 R4，
衛福部 TW Core IG 亦以 R4 為基礎。

## 二、架構：防腐層（Anti-Corruption Layer）

內部 schema 與引擎**不動**；FHIR 只做唯讀 facade（掛在既有 token 認證後）：

```
現有 schema（SQLite/Neon）＋ engine/（不動）
   └── fhir/ 轉接層（新增）
       ├── GET /api/fhir/Patient/1
       ├── GET /api/fhir/Observation?code=29463-7&date=…..
       └── GET /api/fhir/export → Bundle（Patient＋Observations＋Goal）
```

理由：FHIR 資源的重量（identifier/code system/reference/provenance）不該
塞進內部模型；它的價值位置在「出口」——相當於既有 `/api/export` 的第三種
格式。三種資源**手寫 dict 即可**，不必引入 `fhir.resources` 依賴；要嚴謹
驗證（Inferno 等）再考慮。

## 三、導入 HIS 的三階段路線（未來）

| 階段 | 內容 | 門檻 |
|---|---|---|
| **1. 資料可攜**（隨時可做） | FHIR Bundle 匯出；使用者於看診/營養師端自行匯入 | 純技術，無門檻 |
| **2. SMART on FHIR 介接** | OAuth2 向醫院 FHIR 伺服器註冊；讀檢驗/生命徵象、寫量測 | 醫院需開放第三方 App 註冊（多數未開放）；conformance 測試（Inferno） |
| **3. 產品化進診所/醫院** | 多租戶、醫病角色、審計軌跡、InBody 機台整合、資安稽核 | 制度為主：採購流程、資安規範、**SaMD 法規評估** |

務實切入：階段 1 ＋ 找一家合作診所或 InBody 經銷商試點，不直接攻醫院。

## 四、開發前必辦清單（階段 1 的前置）

1. `Profile` 加 `birth_date` 欄位（`alembic revision --autogenerate`；UI
   設定頁同步，`age` 可保留為快速輸入）
2. 查證並選定 body fat／muscle mass 的 LOINC 代碼（量測語義）
3. 決定量測來源標示：自量→`Observation.method`；InBody 機型→`Observation.device`

## 五、法規紅線（進入階段 2/3 前重讀）

目前 App 為生活型建議（wellness）。一旦宣稱往臨床決策支援靠（如用檢驗值
做疾病風險判斷），即進入**醫療器材軟體（SaMD／醫療器材管理法）**管轄——
那是法規評估問題，先於技術規劃。

## 六、建議的第一步（未來開發時）

`GET /api/fhir/export`：R4 Bundle（Patient＋Observation×3 種＋Goal），
附結構與代碼驗證測試——半天到一天。完成後本文件第一節的對映表即為實作規格。
