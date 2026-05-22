"""全局异常捕捉中间件——报错日志与防御"""
import logging
import traceback
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("AncientEncounter")


class GlobalErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(
                f"【系统级崩溃捕获】路径: {request.url.path} | 异常: {str(exc)}\n"
                f"{traceback.format_exc()}"
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error_code": "TIMETRAVEL_CORE_ERROR",
                    "message": "时空裂缝出现剧烈波动，千年的回音在时空中迷失了，请稍后再试。",
                },
            )
