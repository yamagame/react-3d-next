export type Building = { label: string; name: string; bbox: string }

// 日本語数字を半角数字に変換
function replaceNum(str: string) {
  const kans = '〇一二三四五六七八九'
  const zens = '０１２３４５６７８９'
  const nums = '0123456789'
  let tmp
  tmp = new RegExp('銃', 'g')
  str = str.replace(tmp, '10')
  for (let i = 0; i < kans.length; i++) {
    tmp = new RegExp(kans[i], 'g')
    str = str.replace(tmp, nums[i])
  }
  for (let i = 0; i < zens.length; i++) {
    tmp = new RegExp(zens[i], 'g')
    str = str.replace(tmp, nums[i])
  }
  return str
}

export class BuildingNames {
  array: Building[] = []

  push(label: string, name: string, bbox: string) {
    this.array.push({ label, name, bbox })
  }

  find(name: string) {
    const text = replaceNum(name.replace(/\s+/g, ''))
    this.array.sort((a, b) => b.name.length - a.name.length)
    const result = this.array.find((v) => {
      if (text.indexOf(v.name) >= 0) {
        return true
      }
      return false
    })
    return result
  }
}
