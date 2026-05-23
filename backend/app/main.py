"""《此地有古人》后端入口 - 集成名人对话系统"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, SessionLocal, Base
from app.middleware.error_handler import GlobalErrorHandlerMiddleware
from app.routers import encounter, celebrity, tracking, guide
from app.seed import seed_database

# 日志配置
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("AncientEncounter")

# CORS 配置
_allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:8000,http://localhost,capacitor://localhost,http://10.83.190.40:8000",
)
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库与种子数据"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    logger.info("《此地有古人》后端服务启动完成")
    yield
    logger.info("《此地有古人》后端服务关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="《此地有古人》多租户后台 + 名人对话系统",
    version="3.0.0",
    description="基于地理位置与 AI 大模型的文旅体验产品后端服务，集成名人对话功能",
    lifespan=lifespan,
)

# 中间件注册：GlobalErrorHandler 先注册，使其在最内层运行；CORS 最后注册，使其在最外层运行
app.add_middleware(GlobalErrorHandlerMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(encounter.router)   # 古迹神交（原有功能）
app.include_router(celebrity.router)   # 名人对话
app.include_router(guide.router)       # 导游讲解团
app.include_router(tracking.router)    # 技术埋点


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ancient-encounter"}
