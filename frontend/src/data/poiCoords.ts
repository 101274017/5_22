/**
 * 古迹列表数据，用于手动选择
 */
export interface PoiCoord {
  name: string
  desc: string
  icon: string
}

export const POI_COORDS: PoiCoord[] = [
  { name: '惠州西湖', desc: '苏东坡谪居之地', icon: '🏛️' },
  { name: '罗浮山', desc: '苏东坡游历之山', icon: '⛰️' },
  { name: '断桥', desc: '许仙白娘子相遇处', icon: '🌉' },
  { name: '西湖苏堤', desc: '苏东坡筑堤之处', icon: '🌿' },
  { name: '黄鹤楼', desc: '崔颢李白题诗之楼', icon: '🏯' },
  { name: '岳阳楼', desc: '范仲淹记之楼', icon: '🏯' },
  { name: '滕王阁', desc: '王勃序之阁', icon: '🏯' },
  { name: '寒山寺', desc: '张继枫桥夜泊之地', icon: '🛕' },
  { name: '杜甫草堂', desc: '杜甫成都旧居', icon: '🌾' },
]
