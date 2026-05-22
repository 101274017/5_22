"""大模型 API 客户端 - 接入 MiMo-V2.5-Pro"""
import logging
import httpx
from typing import Optional

logger = logging.getLogger("AncientEncounter")

# MiMo-V2.5-Pro 配置
AI_API_KEY = "tp-cj6u4p2z1l1x7er8l9xg1nd4gpv5g1qpq30nl9zpc15vbjdd"
AI_API_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions"
AI_MODEL = "mimo-v2.5-pro"

# 超时配置（名人搜索需要更长时间）
AI_TIMEOUT = 60.0


async def call_ai(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.8,
    max_tokens: int = 2000,
) -> Optional[str]:
    """
    调用 MiMo-V2.5-Pro 大模型 API
    注意：MiMo 模型使用 reasoning tokens，需要给足 max_tokens 空间
    """
    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
            response = await client.post(AI_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # 提取回复内容
            content = data["choices"][0]["message"].get("content", "")
            reply = content.strip() if content else ""
            
            logger.info(f"【AI回复成功】模型={AI_MODEL} tokens_used={data.get('usage', {})} content_len={len(reply)}")
            
            if not reply:
                logger.warning(f"【AI回复为空】可能 reasoning tokens 占满了配额")
                return None
            
            return reply

    except httpx.TimeoutException:
        logger.error(f"【AI超时】模型={AI_MODEL} timeout={AI_TIMEOUT}s")
        return None
    except httpx.HTTPStatusError as e:
        logger.error(f"【AI HTTP错误】status={e.response.status_code} body={e.response.text[:200]}")
        return None
    except Exception as e:
        logger.error(f"【AI调用异常】{type(e).__name__}: {str(e)}")
        return None


async def call_ai_with_history(
    system_prompt: str,
    messages: list[dict],
    temperature: float = 0.8,
    max_tokens: int = 2000,
) -> Optional[str]:
    """
    带历史消息的 AI 调用（用于多轮对话）
    """
    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
    }

    all_messages = [{"role": "system", "content": system_prompt}] + messages

    payload = {
        "model": AI_MODEL,
        "messages": all_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
            response = await client.post(AI_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"].get("content", "")
            reply = content.strip() if content else ""
            
            logger.info(f"【AI多轮对话成功】模型={AI_MODEL} content_len={len(reply)}")
            
            if not reply:
                logger.warning(f"【AI多轮对话回复为空】")
                return None
            
            return reply

    except httpx.TimeoutException:
        logger.error(f"【AI超时】多轮对话 timeout={AI_TIMEOUT}s")
        return None
    except httpx.HTTPStatusError as e:
        logger.error(f"【AI HTTP错误】status={e.response.status_code}")
        return None
    except Exception as e:
        logger.error(f"【AI调用异常】{type(e).__name__}: {str(e)}")
        return None
