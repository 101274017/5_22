"""
P0-2: 名人-古迹关联校验模块
维护 strong_links 映射，用于导游创建讲解团时校验关联度
"""

# 强关联映射：名人 -> 强关联古迹列表
STRONG_LINKS: dict[str, list[str]] = {
    "苏轼": ["惠州西湖", "西湖苏堤", "罗浮山", "赤壁", "黄州", "儋州"],
    "苏东坡": ["惠州西湖", "西湖苏堤", "罗浮山", "赤壁", "黄州", "儋州"],
    "李白": ["黄鹤楼", "庐山", "白帝城", "天门山", "敬亭山", "采石矶"],
    "杜甫": ["杜甫草堂", "岳阳楼", "泰山", "白帝城"],
    "王维": ["辋川", "终南山", "阳关"],
    "辛弃疾": ["北固亭", "京口", "上饶"],
    "许仙": ["断桥", "西湖", "雷峰塔", "金山寺"],
    "白居易": ["西湖白堤", "琵琶亭", "庐山"],
    "岳飞": ["岳王庙", "风波亭", "黄鹤楼"],
    "曹操": ["铜雀台", "赤壁", "许昌"],
    "诸葛亮": ["武侯祠", "隆中", "五丈原"],
    "孔子": ["曲阜", "孔庙", "泰山"],
    "屈原": ["汨罗江", "秭归", "岳阳楼"],
    "陆游": ["沈园", "剑门关"],
    "范仲淹": ["岳阳楼", "滕王阁"],
    "王勃": ["滕王阁"],
    "崔颢": ["黄鹤楼"],
    "张继": ["寒山寺"],
}


def check_celebrity_poi_link(celebrity_name: str, poi_name: str) -> dict:
    """
    校验名人与古迹的关联度
    返回:
        {
            "is_strong": bool,  # 是否强关联
            "message": str | None  # 提示信息（弱关联时）
        }
    """
    strong_pois = STRONG_LINKS.get(celebrity_name, [])

    # 检查是否在强关联列表中（支持模糊匹配）
    for poi in strong_pois:
        if poi in poi_name or poi_name in poi:
            return {"is_strong": True, "message": None}

    # 如果名人不在映射中，默认通过（不阻断）
    if celebrity_name not in STRONG_LINKS:
        return {"is_strong": True, "message": None}

    # 弱关联
    return {
        "is_strong": False,
        "message": f"「{celebrity_name}」与「{poi_name}」关联较弱，建议更换或确认继续",
    }
