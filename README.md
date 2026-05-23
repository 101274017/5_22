# 此地有古人 · 异代相逢

基于地理位置与 AI 大模型的沉浸式文旅体验产品。当现代人步入历史遗迹，通过空间坐标与时空特征，创造一场与古代先贤跨越千年的"神交"。

> **当前版本：v3.0** | 支持双模式运行：前端独立 APK + 前后端联调

---

## 产品功能

### 一、古迹神交

踏入历史遗迹，召唤与此地渊源最深的古人，开启一场跨时空对话。

| 环节 | 说明 |
|------|------|
| 召唤 | 扫码/定位/手动选择古迹，AI 自动生成古人角色与开场白 |
| 出题 | 古人抛出开放式提问，引发用户思考 |
| 作答 | 用户提交感悟，AI 基于角色性格生成点评 |
| 赠语 | 生成专属精神赠语与精神徽章 |
| 追问 | 自由对话，RAG 知识库防幻觉边界卡点 |
| 分享 | 生成精神名片，支持社交裂变 |

### 二、名人对话

搜索任意中外名人，AI 自动检索生平资料并构建角色，开启自由对话。

- **内置知识库**：苏东坡、李白、杜甫等 9 位中国历史名人完整生平
- **Web 搜索增强**：对未内置名人自动搜索网络资料
- **消歧义处理**：同名人物自动提示选择
- **精神名片**：对话满 2 轮后生成专属赠语与徽章

### 三、导游讲解团

导游创建讲解团，选择名人与古迹，AI 以名人第一人称视角为游客进行沉浸式讲解。

- 导游创建团 → 生成 6 位团码与二维码
- 游客扫码/输码加入
- AI 名人实时讲解，支持游客追问互动
- 讲解团数据本地存储，适合单设备演示或多设备同账号使用

### 四、人生地理志

永久记录所有神交与对话历史，形成个人精神足迹地图。

- 按时间倒序排列所有记录
- 精神徽章墙展示已获得称号
- 点击记录查看详情与精神名片

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端（React + Capacitor）                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 古迹神交     │  │ 名人对话     │  │ 导游讲解团   │              │
│  │ encounter   │  │ celebrity   │  │ guide       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  本地引擎层（services/）                                    │  │
│  │  · encounterEngine.ts  — 神交业务逻辑 + AI 调用              │  │
│  │  · celebrityEngine.ts  — 名人对话 + Web 搜索                 │  │
│  │  · guideEngine.ts      — 讲解团管理 + 讲解生成               │  │
│  │  · aiClient.ts         — MiMo API 客户端                   │  │
│  │  · webSearch.ts        — 网络搜索（名人资料检索）             │  │
│  │  · knowledgeBase.ts    — 内置名人知识库                      │  │
│  │  · localStore.ts       — localStorage 数据持久化             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API 层（api/）—— 可选后端模式                              │  │
│  │  · request.ts          — 统一 HTTP 请求封装                  │  │
│  │  · client.ts           — 后端 API 客户端                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
     ┌────────▼────────┐           ┌──────────▼──────────┐
     │  MiMo AI API     │           │  后端（FastAPI）     │
     │ （直接调用）      │           │ （可选联调模式）     │
     └─────────────────┘           │  · SQLite 数据库     │
                                   │  · 多租户隔离        │
                                   │  · 服务端 AI 调用    │
                                   │  · 技术埋点持久化    │
                                   └─────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 构建工具 | Vite 6 |
| 移动端 | Capacitor 8（Android）|
| 后端框架 | FastAPI 0.115 |
| ORM | SQLAlchemy 2.0 |
| 数据库 | SQLite |
| AI 模型 | MiMo-V2.5-Pro |
| HTTP 客户端 | httpx |

---

## 双模式运行说明

本项目支持两种运行方式，可根据场景灵活选择。

### 模式 A：前端独立运行（推荐 APK）

AI 对话、知识库、数据存储**全部在端侧完成**，无需后端服务。App 直接通过手机网络调用云端 MiMo AI。

**适用场景**：个人体验、线下活动、无网络环境（仅查看历史）

```
手机 ──WiFi/移动数据──→ MiMo AI API
  │
  └─ localStorage（数据持久化）
```

### 模式 B：前后端联调

前端调用本地/远程后端 API，由后端统一调度 AI、管理数据库。

**适用场景**：开发调试、多租户管理、数据集中分析

```
手机 ──局域网──→ 后端（FastAPI + SQLite）──→ MiMo AI API
```

| 功能 | 模式 A（前端独立） | 模式 B（前后端联调） |
|------|-------------------|---------------------|
| 古迹神交 | 本地引擎 + AI | 后端 API + AI |
| 名人对话 | 本地引擎 + AI | 后端 API + AI |
| 导游讲解团 | 本地存储 + AI | 后端数据库存储 + AI |
| 历史记录 | localStorage | SQLite |
| 技术埋点 | 不上报 | 后端持久化 |
| 多租户 | 不隔离 | 租户隔离 |

---

## 快速开始

### 环境要求

- Python 3.10+（仅模式 B）
- Node.js 18+
- pnpm
- Android Studio（仅打包 APK）

### 模式 A：前端独立运行

```bash
cd frontend
pnpm install
pnpm dev          # 开发服务器 http://localhost:5173
```

手机访问需使用 `pnpm dev --host` 并通过局域网 IP 访问。

### 模式 B：前后端联调

**1. 配置环境变量**

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 MiMo API Key
```

**2. 启动后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端启动后自动创建 SQLite 数据库并加载种子数据。

**3. 启动前端**

```bash
cd frontend
pnpm install
pnpm dev
```

**4. 配置服务器地址**

打开前端页面后，点击右上角 "设置"，填入后端地址（如 `http://192.168.1.100:8000`）。

---

## 构建 Android APK

```bash
cd frontend

# 1. 构建 Web 资源
pnpm build

# 2. 同步到 Android 项目
npx cap sync android

# 3. 打包 Release APK
cd android
./gradlew assembleRelease

# 输出路径：android/app/build/outputs/apk/release/app-release.apk
```

### APK 使用说明

1. 将 APK 复制到安卓手机并安装（允许"未知来源"）
2. 打开 App 即可使用，**无需配置服务器**
3. 确保手机已联网（WiFi 或移动数据）
4. 首次启动可在设置页配置后端地址（切换为模式 B）

---

## 项目结构

```
├── backend/                     # FastAPI 后端（模式 B）
│   ├── app/
│   │   ├── main.py              # 应用入口
│   │   ├── database.py          # SQLite 数据库配置
│   │   ├── ai_client.py         # MiMo AI 客户端
│   │   ├── knowledge_base.py    # 知识库构建
│   │   ├── celebrity_engine.py  # 名人资料检索引擎
│   │   ├── seed.py              # 种子数据初始化
│   │   ├── models/              # SQLAlchemy ORM 模型
│   │   │   ├── character.py     # 古迹-古人配置
│   │   │   ├── encounter.py     # 神交记录
│   │   │   ├── guide_tour.py    # 讲解团
│   │   │   └── tracking_log.py  # 埋点日志
│   │   ├── schemas/             # Pydantic DTO
│   │   ├── routers/             # API 路由
│   │   │   ├── encounter.py     # 古迹神交
│   │   │   ├── celebrity.py     # 名人对话
│   │   │   ├── guide.py         # 导游讲解团
│   │   │   └── tracking.py      # 技术埋点
│   │   ├── middleware/          # 中间件
│   │   │   ├── tenant.py        # 多租户隔离
│   │   │   └── error_handler.py # 全局错误处理
│   │   └── utils/               # 工具
│   │       └── bounded_cache.py # 有界对话缓存
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                    # React 前端（双模式）
│   ├── src/
│   │   ├── App.tsx              # 路由管理 + 页面调度
│   │   ├── main.tsx             # 应用入口
│   │   ├── pages/               # 页面组件
│   │   │   ├── LandingPage.tsx      # 启动页（选择模式）
│   │   │   ├── HomePage.tsx         # 首页
│   │   │   ├── EncounterPage.tsx    # 古迹神交流程
│   │   │   ├── GeographyPage.tsx    # 人生地理志
│   │   │   ├── ShareCardPage.tsx    # 精神名片分享
│   │   │   ├── CelebrityEntryPage.tsx   # 名人搜索入口
│   │   │   ├── CelebrityChatPage.tsx    # 名人对话
│   │   │   ├── CelebrityCardPage.tsx    # 名人精神名片
│   │   │   ├── CelebrityHistoryPage.tsx # 名人历史
│   │   │   ├── GuideEntryPage.tsx       # 讲解团入口
│   │   │   ├── GuideSetupPage.tsx       # 创建讲解团
│   │   │   ├── GuideQRCodePage.tsx      # 团码/二维码
│   │   │   ├── GuideToursPage.tsx       # 我的讲解团
│   │   │   ├── GuideJoinPage.tsx        # 游客加入
│   │   │   ├── GuideTourViewPage.tsx    # 讲解界面
│   │   │   └── SettingsPage.tsx         # 设置
│   │   ├── services/            # 本地业务引擎（模式 A）
│   │   │   ├── aiClient.ts          # MiMo API 客户端
│   │   │   ├── encounterEngine.ts   # 神交引擎
│   │   │   ├── celebrityEngine.ts   # 名人引擎
│   │   │   ├── guideEngine.ts       # 讲解团引擎
│   │   │   ├── webSearch.ts         # 网络搜索
│   │   │   ├── knowledgeBase.ts     # 内置知识库
│   │   │   └── localStore.ts        # localStorage 封装
│   │   ├── api/                 # 后端 API 客户端（模式 B）
│   │   │   ├── request.ts           # HTTP 请求封装
│   │   │   ├── client.ts            # API 基础客户端
│   │   │   ├── encounterApi.ts      # 神交 API
│   │   │   ├── celebrityApi.ts      # 名人 API
│   │   │   └── guideApi.ts          # 讲解团 API
│   │   ├── data/                # 静态数据
│   │   │   └── poiCoords.ts         # 古迹坐标数据
│   │   ├── types/               # TypeScript 类型
│   │   ├── utils/               # 工具函数
│   │   └── components/          # 公共组件
│   │       ├── PageHeader.tsx
│   │       └── ErrorBoundary.tsx
│   ├── android/                 # Capacitor Android 项目
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.production
│
├── README.md
└── package.json
```

---

## API 概览

### 古迹神交

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/encounter/summon` | 召唤古人，AI 生成开场白 |
| POST | `/api/v1/encounter/answer` | 提交答卷，AI 生成赠语与徽章 |
| POST | `/api/v1/encounter/chat` | 自由追问，多轮对话 |
| GET | `/api/v1/encounter/list` | 人生地理志列表 |
| GET | `/api/v1/encounter/{id}` | 神交详情 |

### 名人对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/celebrity/check-disambiguation` | 检查名人消歧义 |
| POST | `/api/v1/celebrity/start` | 开始名人对话 |
| POST | `/api/v1/celebrity/chat` | 发送消息 |
| POST | `/api/v1/celebrity/generate-card` | 生成精神名片 |
| GET | `/api/v1/celebrity/list` | 对话记录列表 |
| GET | `/api/v1/celebrity/{id}` | 对话详情 |

### 导游讲解团

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/guide/check-link` | 校验名人与古迹关联度 |
| POST | `/api/v1/guide/create-tour` | 创建讲解团 |
| POST | `/api/v1/guide/join-tour` | 游客加入讲解团 |
| POST | `/api/v1/guide/narrate` | AI 名人讲解 |
| POST | `/api/v1/guide/close-tour` | 关闭讲解团 |
| GET | `/api/v1/guide/my-tours` | 我的讲解团列表 |

### 技术埋点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/track` | 埋点事件上报 |

---

## 核心设计

### 双模式架构

前端引擎层（`services/`）与 API 层（`api/`）解耦，同一套 UI 页面根据配置自动选择本地引擎或后端 API：

- 未配置后端地址 → 自动使用本地引擎（模式 A）
- 配置了后端地址 → 调用后端 API（模式 B）

### RAG 防幻觉

- 内置知识库严格限定古人认知边界
- 追问环节关键词检测（"未见记载"、"不敢断言"等）
- AI 系统提示中锁定死亡年份，禁止讨论身后事

### 多租户隔离

后端通过 `X-Tenant-ID` 请求头实现租户隔离，不同景区/组织数据完全独立。

### 有界缓存

多轮对话历史使用 LRU 有界缓存（最大 500 条），防止内存泄漏。

---

## 常见问题

| 问题 | 解决方法 |
|------|---------|
| 对话时一直加载 | 确认手机已联网（WiFi 或移动数据） |
| 回答很慢 | 大模型响应需 5-10 秒，请耐心等待 |
| 历史记录消失 | 请勿清除 App 数据或卸载重装 |
| 无法连接后端 | 确认手机与电脑在同一 WiFi，且 IP 配置正确 |
| 多设备数据同步 | 模式 A 不支持，需切换到模式 B |

---

## 许可证

MIT
