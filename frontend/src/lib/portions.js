// 份量速選：把食物類別的「每份公克」換算成可點選的份量按鈕。
// 單位常數來自後端 /api/six-groups/units（與六大類自動估算同源），
// 這裡只負責組 label 與份量倍數。
const MULTIPLES = [
  [0.5, '½'],
  [1, '1'],
  [2, '2'],
]

export default function portionChips(category, units) {
  const u = units && units[category]
  if (!u) return []          // other 類等沒有定義單位的 → 不顯示
  return MULTIPLES.map(([mult, label]) => ({
    label: `${label} ${u.unit}`,
    grams: Math.round(u.grams * mult),
    hint: `${u.label} ${label} ${u.unit} ≈ ${Math.round(u.grams * mult)}g`,
  }))
}
