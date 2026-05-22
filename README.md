# 此地有古人 · 异代相逢

基于地理位置与 AI 大模型的文旅体验产品。当现代人步入历史遗迹时，通过空间坐标和时空特征，创造一场与古代先贤跨越千年的"神交"。

## 项目结构

```
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── main.py          # 应用入口
│   │   ├── database.py      # 数据库配置
│   │   ├── seed.py          # 种子数据
│   │   ├── models/          # SQLAlchemy ORM 模型
│   │   ├── schemas/         # Pydantic DTO
│   │   ├── routers/         # API 路由
│   │   └── middleware/      # 中间件（租户隔离、错误处理）
│   └── requirements.txt
├── frontend/         # React + TypeScript + Tailwind 前端（移动端 H5）
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── pages/           # 页面组件
│   │   │   ├── EntryPage    # 入口（扫码/定位/选择古迹）
│   │   │   ├── EncounterPage# 神交（召唤→出题→作答→赠语→追问）
│   │   │   ├── GeographyPage# 人生地理志（历史记录+徽章墙）
│   │   │   └── ShareCardPage# 精神名片（分享裂变）
│   │   └── utils/           # 工具（埋点SDK、用户ID）
│   └── package.json
└── README.md
```

## 快速启动

### 环境要求

- Python 3.10+
- Node.js 18+
- pnpm

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端运行在 http://localhost:5173，已配置代理转发 `/api` 到后端。
手机访问需使用 `pnpm dev --host` 并通过局域网 IP 访问。

## 核心业务闭环

1. 📷 扫码 / 📍 地理定位 / 手动选择 → 进入古迹
2. 🌫️ 古人剪影降临动画
3. 📜 古人开场白 + 抛出开放式提问
4. ✍️ 用户作答提交
5. 🎑 生成专属赠语与精神徽章
6. 📖 永久记入《人生地理志》
7. 💬 自由追问（RAG 防幻觉边界卡点）
8. 🃏 生成精神名片分享裂变

## 技术特性

- **多租户隔离**：所有 API 强制 X-Tenant-ID Header，中间件层统一拦截
- **技术埋点**：前端 SDK 采集 + 后端持久化，支持 view/click/error/api_perf 事件
- **报错日志**：全局异常中间件捕获，详细堆栈记录于服务端，客户端仅返回友好提示
- **RAG 防幻觉**：自由追问环节严格边界卡点，不知为不知
- **移动端适配**：纯 H5 移动端体验，支持手机浏览器直接使用

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/encounter/summon | 召唤古人 |
| POST | /api/v1/encounter/answer | 提交答卷 |
| POST | /api/v1/encounter/chat   | 自由追问 |
| GET  | /api/v1/encounter/list   | 人生地理志（记录列表） |
| GET  | /api/v1/encounter/{id}   | 神交详情（精神名片） |
| POST | /api/v1/track            | 埋点上报 |
| GET  | /health                  | 健康检查 |
