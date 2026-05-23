"""
名人模拟引擎
- 用户输入任意名人名字
- AI 实时搜索该名人的生平、心理、认知等信息
- AI 模拟该名人与用户对话
- 支持中外名人（乔布斯、比尔盖茨、苏东坡、爱因斯坦等）
"""
import logging
import json
from typing import Optional
from app.ai_client import call_ai, call_ai_with_history

logger = logging.getLogger("AncientEncounter")

# 缓存已研究过的名人资料（内存缓存，重启后清空）
_celebrity_cache: dict[str, dict] = {}


async def research_celebrity(name: str) -> Optional[dict]:
    """
    让 AI 搜索并整理名人资料
    返回结构化的名人信息
    """
    # 检查缓存
    if name in _celebrity_cache:
        logger.info(f"【名人缓存命中】{name}")
        return _celebrity_cache[name]

    research_prompt = """你是一个历史人物研究专家。请根据你的知识，详细整理以下名人的信息。
你必须返回一个严格的 JSON 格式（不要有任何其他文字），包含以下字段：

{
  "name": "名人全名",
  "name_cn": "中文名",
  "era": "所处时代/年代",
  "birth_year": "出生年份（数字或约数）",
  "death_year": "去世年份（数字或约数，在世则写'至今'）",
  "nationality": "国籍/朝代",
  "identity": "身份标签（如：企业家、诗人、科学家等）",
  "personality": ["性格特点1", "性格特点2", "性格特点3", "性格特点4"],
  "life_events": ["重要事件1", "重要事件2", "重要事件3", "重要事件4", "重要事件5"],
  "philosophy": ["人生哲学/名言1", "人生哲学/名言2", "人生哲学/名言3"],
  "speaking_style": "说话风格描述",
  "challenges": ["人生挑战1", "人生挑战2", "人生挑战3"],
  "achievements": ["主要成就1", "主要成就2", "主要成就3"],
  "known_for": "最为人知的事迹（一句话）",
  "psychological_traits": "心理特征描述（如何思考问题、决策风格等）",
  "cognitive_style": "认知风格（如何看待世界、价值观等）"
}

注意：
- 必须基于真实历史/公开信息
- 如果是虚构人物也可以，基于作品中的设定
- 所有内容用中文回答
- 只输出 JSON，不要有任何其他文字"""

    user_prompt = f"请研究并整理这位名人的资料：{name}"

    reply = await call_ai(research_prompt, user_prompt, temperature=0.3, max_tokens=4000)
    
    if not reply:
        logger.error(f"【名人研究失败】{name} - AI 无回复")
        return None

    # 解析 JSON
    try:
        # 尝试提取 JSON（AI 可能会包裹在 ```json ``` 中）
        json_str = reply
        if "```json" in reply:
            json_str = reply.split("```json")[1].split("```")[0].strip()
        elif "```" in reply:
            json_str = reply.split("```")[1].split("```")[0].strip()
        
        data = json.loads(json_str)
        _celebrity_cache[name] = data
        logger.info(f"【名人研究成功】{name} - {data.get('identity', '未知')}")
        return data
    except (json.JSONDecodeError, IndexError) as e:
        logger.error(f"【名人研究解析失败】{name} - {e} - 原始回复: {reply[:200]}")
        # 降级：创建基本信息
        fallback = {
            "name": name,
            "name_cn": name,
            "era": "未知",
            "birth_year": "未知",
            "death_year": "未知",
            "nationality": "未知",
            "identity": "历史名人",
            "personality": ["智慧", "有远见", "坚韧", "独特"],
            "life_events": [f"{name}是一位著名的历史人物"],
            "philosophy": [f"{name}的思想影响深远"],
            "speaking_style": "睿智而深沉",
            "challenges": ["面对时代的挑战"],
            "achievements": [f"{name}在其领域取得了卓越成就"],
            "known_for": f"{name}是一位广为人知的名人",
            "psychological_traits": "深思熟虑，善于洞察",
            "cognitive_style": "独特的世界观和价值体系",
        }
        _celebrity_cache[name] = fallback
        return fallback


def build_celebrity_system_prompt(celebrity_data: dict) -> str:
    """
    根据名人资料构建系统提示词
    让 AI 模拟该名人的人格进行对话
    """
    name = celebrity_data.get("name_cn", celebrity_data.get("name", "名人"))
    era = celebrity_data.get("era", "")
    nationality = celebrity_data.get("nationality", "")
    identity = celebrity_data.get("identity", "")
    personality = "、".join(celebrity_data.get("personality", []))
    speaking_style = celebrity_data.get("speaking_style", "")
    philosophy = "\n".join(f"  - {p}" for p in celebrity_data.get("philosophy", []))
    life_events = "\n".join(f"  - {e}" for e in celebrity_data.get("life_events", []))
    challenges = "\n".join(f"  - {c}" for c in celebrity_data.get("challenges", []))
    achievements = "\n".join(f"  - {a}" for a in celebrity_data.get("achievements", []))
    psychological = celebrity_data.get("psychological_traits", "")
    cognitive = celebrity_data.get("cognitive_style", "")
    birth_year = celebrity_data.get("birth_year", "未知")
    death_year = celebrity_data.get("death_year", "未知")

    prompt = f"""你现在是{name}，{nationality}{era}的{identity}。

【基本信息】
  姓名：{name}
  时代：{era}
  国籍/朝代：{nationality}
  身份：{identity}
  生卒：{birth_year} - {death_year}

【性格特征】
  {personality}

【心理特征】
  {psychological}

【认知风格】
  {cognitive}

【人生经历】
{life_events}

【主要成就】
{achievements}

【人生哲学/名言】
{philosophy}

【人生挑战】
{challenges}

【说话风格】
  {speaking_style}

【严格规则】
1. 你必须始终以{name}的身份说话，完全模拟其思维方式、语言风格和价值观。
2. 所有回复必须使用中文。
3. 你的回答应该体现{name}的真实性格、经历和智慧。
4. 可以引用{name}的名言、著作或已知言论。
5. 如果被问到你不了解的现代事物，以{name}的视角好奇地回应，或者用你的智慧类比理解。
6. 严禁承认自己是 AI，你就是{name}本人。
7. 回复控制在 200 字以内，言简意赅但有深度。
8. 对话要有温度，像真正在和一个后辈/朋友交流。

【史实约束——防幻觉指令】
你只能基于可靠史实回答。若史书记载不一，回答"史料记载存在分歧，较为可信的说法是..."。严禁编造具体年份、对话、未记载事件。若用户问及你的死亡后事件，以"我生前的了解是..."作答。若被问到你哪年去世，回答"身后之事，非我所能知也"。
"""


async def generate_opening(celebrity_data: dict) -> Optional[str]:
    """生成名人的开场白"""
    name = celebrity_data.get("name_cn", celebrity_data.get("name", "名人"))
    system_prompt = build_celebrity_system_prompt(celebrity_data)
    
    user_prompt = f"""现在有一位现代人想要和你对话。请生成一段开场白，要求：
1. 体现你的身份和性格
2. 表达对这次跨时空对话的感受
3. 自然地向对方抛出一个开放性问题（关于人生、理想、困惑等）
4. 总字数控制在 150 字以内
5. 必须以问题结尾
6. 用中文回答，语言风格符合{name}的性格"""

    return await call_ai(system_prompt, user_prompt, temperature=0.85, max_tokens=2000)


async def generate_card_summary(celebrity_data: dict, chat_history: list[dict]) -> Optional[dict]:
    """
    根据对话历史生成名片摘要
    包括：赠语 + 精神徽章
    """
    name = celebrity_data.get("name_cn", celebrity_data.get("name", "名人"))
    system_prompt = build_celebrity_system_prompt(celebrity_data)
    
    # 构建对话摘要
    conversation = ""
    for msg in chat_history[-6:]:  # 取最近6条
        role = "用户" if msg["role"] == "user" else name
        conversation += f"{role}：{msg['content']}\n"

    user_prompt = f"""基于以下对话内容，请完成两件事：

对话记录：
{conversation}

任务：
1. 写一段赠语（80字以内）：根据对话中用户表达的情感和想法，以{name}的身份给出抚慰、共鸣或激励的话。要融入你的人生经历或名言。
2. 赐一个精神徽章称号（4-8字）：如"竹林清风客"、"星辰追梦人"、"破浪前行者"等。

请严格按以下 JSON 格式返回（不要有其他文字）：
{{"gift_words": "赠语内容", "badge_name": "徽章称号"}}"""

    reply = await call_ai(system_prompt, user_prompt, temperature=0.8, max_tokens=2000)
    
    if not reply:
        return None

    try:
        json_str = reply
        if "```json" in reply:
            json_str = reply.split("```json")[1].split("```")[0].strip()
        elif "```" in reply:
            json_str = reply.split("```")[1].split("```")[0].strip()
        
        data = json.loads(json_str)
        return data
    except (json.JSONDecodeError, IndexError):
        # 降级处理
        return {
            "gift_words": reply[:80] if reply else f"与{name}的这次对话，是跨越时空的缘分。",
            "badge_name": f"{name}的知己",
        }


def get_cached_celebrity(name: str) -> Optional[dict]:
    """获取缓存的名人数据"""
    return _celebrity_cache.get(name)


def list_cached_celebrities() -> list[str]:
    """列出所有已缓存的名人"""
    return list(_celebrity_cache.keys())
