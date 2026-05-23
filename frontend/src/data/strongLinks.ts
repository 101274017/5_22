/**
 * P0-2: 名人-古迹强关联映射（前端本地校验用）
 */

export const STRONG_LINKS: Record<string, string[]> = {
  '苏东坡': ['惠州西湖', '西湖苏堤', '罗浮山', '赤壁', '黄州', '儋州'],
  '苏轼': ['惠州西湖', '西湖苏堤', '罗浮山', '赤壁', '黄州', '儋州'],
  '李白': ['黄鹤楼', '庐山', '白帝城', '天门山', '敬亭山', '采石矶'],
  '杜甫': ['杜甫草堂', '岳阳楼', '泰山', '白帝城'],
  '王维': ['辋川', '终南山', '阳关'],
  '辛弃疾': ['北固亭', '京口', '上饶'],
  '许仙': ['断桥', '西湖', '雷峰塔', '金山寺'],
  '白居易': ['西湖白堤', '琵琶亭', '庐山'],
  '岳飞': ['岳王庙', '风波亭', '黄鹤楼'],
  '曹操': ['铜雀台', '赤壁', '许昌'],
  '诸葛亮': ['武侯祠', '隆中', '五丈原'],
  '孔子': ['曲阜', '孔庙', '泰山'],
  '屈原': ['汨罗江', '秭归', '岳阳楼'],
  '陆游': ['沈园', '剑门关'],
  '范仲淹': ['岳阳楼', '滕王阁'],
  '王勃': ['滕王阁'],
  '崔颢': ['黄鹤楼'],
  '张继': ['寒山寺'],
}

/**
 * 检查名人与古迹是否强关联
 */
export function checkStrongLink(celebrityName: string, poiName: string): { isStrong: boolean; message: string | null } {
  const pois = STRONG_LINKS[celebrityName]
  if (!pois) {
    // 名人不在映射中，默认通过
    return { isStrong: true, message: null }
  }
  for (const poi of pois) {
    if (poi.includes(poiName) || poiName.includes(poi)) {
      return { isStrong: true, message: null }
    }
  }
  return {
    isStrong: false,
    message: `「${celebrityName}」与「${poiName}」关联较弱，建议更换或确认继续`,
  }
}
