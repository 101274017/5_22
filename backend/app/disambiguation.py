"""
P0-1: 历史人物重名消歧义模块
硬编码10个高频重名人物映射
"""

# 重名人物映射：输入名 -> 多个候选人物
# 如果输入的名字在此映射中，前端需要展示选择页
DISAMBIGUATION_MAP: dict[str, list[dict]] = {
    "张学良": [
        {
            "id": "zhang_xueliang_general",
            "name": "张学良",
            "birth_year": 1901,
            "death_year": 2001,
            "identity": "奉系将领",
            "label": "少帅，东北军统帅，西安事变发动者",
        },
    ],
    "李斯": [
        {
            "id": "li_si_qin",
            "name": "李斯",
            "birth_year": -284,
            "death_year": -208,
            "identity": "秦朝丞相",
            "label": "法家代表，助秦始皇统一六国",
        },
    ],
    "王安石": [
        {
            "id": "wang_anshi_song",
            "name": "王安石",
            "birth_year": 1021,
            "death_year": 1086,
            "identity": "北宋政治家、文学家",
            "label": "唐宋八大家之一，推行变法",
        },
    ],
    "张飞": [
        {
            "id": "zhang_fei_shu",
            "name": "张飞",
            "birth_year": 167,
            "death_year": 221,
            "identity": "蜀汉猛将",
            "label": "桃园三结义，万人敌",
        },
    ],
    "韩信": [
        {
            "id": "han_xin_general",
            "name": "韩信",
            "birth_year": -231,
            "death_year": -196,
            "identity": "西汉开国功臣",
            "label": "兵仙，国士无双",
        },
    ],
    "苏轼": [
        {
            "id": "su_shi_song",
            "name": "苏轼",
            "birth_year": 1037,
            "death_year": 1101,
            "identity": "北宋文豪",
            "label": "即苏东坡，诗词书画皆精",
            "alias": "苏东坡",
        },
    ],
    "苏东坡": [
        {
            "id": "su_shi_song",
            "name": "苏东坡",
            "birth_year": 1037,
            "death_year": 1101,
            "identity": "北宋文豪",
            "label": "即苏轼，诗词书画皆精",
            "alias": "苏轼",
        },
    ],
    "武则天": [
        {
            "id": "wu_zetian_tang",
            "name": "武则天",
            "birth_year": 624,
            "death_year": 705,
            "identity": "唐朝/武周女皇",
            "label": "中国历史上唯一正统女皇帝",
        },
    ],
    "曹操": [
        {
            "id": "cao_cao_wei",
            "name": "曹操",
            "birth_year": 155,
            "death_year": 220,
            "identity": "东汉末年政治家、军事家",
            "label": "魏武帝，三国枭雄",
        },
    ],
    "孙权": [
        {
            "id": "sun_quan_wu",
            "name": "孙权",
            "birth_year": 182,
            "death_year": 252,
            "identity": "东吴大帝",
            "label": "三国吴主，生子当如孙仲谋",
        },
    ],
}

# 别名合并映射：将不同名字指向同一人
ALIAS_MAP: dict[str, str] = {
    "苏轼": "苏东坡",
    "苏子瞻": "苏东坡",
    "东坡居士": "苏东坡",
    "李太白": "李白",
    "青莲居士": "李白",
    "杜子美": "杜甫",
    "少陵野老": "杜甫",
    "王摩诘": "王维",
    "辛幼安": "辛弃疾",
    "稼轩": "辛弃疾",
}


def resolve_alias(name: str) -> str:
    """解析别名，返回标准名"""
    return ALIAS_MAP.get(name, name)


def check_disambiguation(name: str) -> list[dict] | None:
    """
    检查是否需要消歧义
    返回 None 表示无需消歧义（直接进入对话）
    返回列表表示需要用户选择
    """
    resolved = resolve_alias(name)
    candidates = DISAMBIGUATION_MAP.get(resolved)
    # 只有当候选人数 > 1 时才需要选择页
    # 当前设计：即使只有1个候选也返回（用于展示确认卡片）
    # 但如果名字不在映射中，返回 None（直接进入）
    if candidates:
        return candidates
    return None
