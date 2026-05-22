# 《此地有古人》产品需求文档（PRD）V3.0 —— 基于实际实现的产品规格说明

## 1. 产品概述与核心价值

### 1.1 产品定位

《此地有古人》是一个基于地理位置与 AI 大模型的文旅体验产品。产品包含两大核心功能模块：

1. **古迹神交**：当用户步入历史遗迹时，通过地理围栏/扫码触发，与该地相关的古代先贤进行跨越千年的"神交"对话。
2. **名人对话**：用户可自由输入任意古今中外名人名字，AI 实时研究该名人资料并模拟其人格进行多轮对话。

* **核心信条：** 我们不提供标准答案，我们创造时空奇遇。
* **产品定位：** 拒绝沦为传统的"知识容器"与"AI 导游"，致力于构建现代人与历史人物之间不可替代的精神羁绊。

### 1.2 第一性原理推导

| 第一性事实 | 推导出的产品原则 |
|---|---|
| 旅行的根本困境是存在感的孤独（游客无法与厚重时空产生个人化连接）。 | 产品必须创造**"被历史选中"**的体验，而非灌输历史常识。 |
| 用户对数字文旅最深的渴望是奇遇。 | 产品核心是**"被古人提问的那一刻"**，让用户通过主观表达参与历史。 |
| AI 扮演古人的最大失败是缺乏边界、装神弄鬼。 | 第一性技术原则是**绝对诚实（不知为不知）**，以此建立产品的人文信任和技术壁垒。 |

### 1.3 多维对比：AI 导游 vs. 此地有古人

| 维度 | AI 导游（传统竞品） | 此地有古人（本产品） |
|---|---|---|
| **AI 角色定位** | 导游/客服，单向的工具服务提供者 | 故人/知音，双向跨越时空的对话者 |
| **核心交互动作** | 讲给你听（景点复述） | **问你一个问题（灵魂共鸣）** |
| **用户身份定义** | 游客，被动的历史听众 | 后生/知音，被历史选中的时空亲历者 |
| **徽章系统意义** | 地理打卡标记 | **身份与精神定义（如："苏东坡的千年知己"）** |
| **大模型防幻觉** | 数据补充、强行灌输 | **人格层面的诚实、史料限定与合理留白** |
| **产品终点沉淀** | 服务完成，用完即弃 | 精神资产持续生长，沉淀至《人生地理志》 |

---

## 2. 系统架构

### 2.1 技术栈

| 层级 | 技术选型 |
|---|---|
| 后端框架 | Python FastAPI 3.0 |
| 数据库 | SQLite（文件持久化：`ancient_encounter.db`） |
| ORM | SQLAlchemy |
| AI 大模型 | MiMo-V2.5-Pro（小米 AI 模型） |
| 前端框架 | React 18 + TypeScript + Vite |
| UI 样式 | Tailwind CSS 3 |
| 移动端 | Capacitor（Android 原生打包） |
| 地理定位 | @capacitor/geolocation |

### 2.2 多租户（Tenant Isolation）架构

系统底层采用多租户隔离架构：

* **租户标识：** 所有 API 请求通过 `X-Tenant-ID` Header 进行租户身份确权。
* **数据隔离：** 古迹配置、神交记录均通过 `tenant_id` 字段进行逻辑隔离。
* **中间件拦截：** 后端通过 FastAPI 依赖注入在路由层统一拦截校验，杜绝数据越权。
* **名人对话模块：** 使用固定 `tenant_id = "celebrity_chat"` 标识，不受多租户限制。

### 2.3 已配置租户

| 租户 ID | 归属 | 管辖古迹 |
|---|---|---|
| `tenant_huizhou_gov` | 惠州文旅局 | 惠州西湖、罗浮山 |
| `tenant_hangzhou_gov` | 杭州文旅局 | 断桥、西湖苏堤 |

---

## 3. 功能模块一：古迹神交

### 3.1 核心业务闭环

```text
【地理围栏匹配/扫码/手动选择】 → 【时空裂缝开启动画（2秒）】 → 【AI 生成带时间/地点感的开场白】 →
【古人抛出开放式提问】 → 【用户作答提交】 → 【AI 生成专属赠语 + AI 生成精神徽章】 →
【永久记入《人生地理志》】 → 【AI 多轮自由追问（RAG 防幻觉）】 → 【生成精神名片分享裂变】
```

### 3.2 API 接口规范

#### 3.2.1 召唤古人

```
POST /api/v1/encounter/summon
Header: X-Tenant-ID (必填)
Body: { "user_id": string, "poi_name": string }
Response: { "encounter_id": int, "character_name": string, "opening_speech": string, "question": string }
```

* 根据 `tenant_id + poi_name` 匹配古人配置
* 调用 AI 大模型实时生成开场白和问题（非预设文案）
* 失败自动重试 3 次
* 创建 encounter 记录，状态为 `summoned`

#### 3.2.2 递交答卷

```
POST /api/v1/encounter/answer
Header: X-Tenant-ID (必填)
Body: { "encounter_id": int, "user_answer": string }
Response: { "gift_words": string, "badge_name": string, "badge_icon": string }
```

* AI 根据用户作答内容生成个性化赠语（融入古人诗词典故）
* AI 单独生成 4-8 字精神徽章称号
* 更新 encounter 状态为 `completed`

#### 3.2.3 自由追问

```
POST /api/v1/encounter/chat
Header: X-Tenant-ID (必填)
Body: { "encounter_id": int, "message": string }
Response: { "reply": string, "reference": string }
```

* 支持多轮对话（内存保存最近 8 条历史）
* AI 基于人物知识库生成回复
* 自动检测防幻觉关键词（"未见记载"、"非我朝所有"等），标注防御状态
* `reference` 字段标注回复来源（知识库生成 / 边界防御触发）

#### 3.2.4 神交记录列表

```
GET /api/v1/encounter/list?user_id={userId}
Header: X-Tenant-ID (必填)
Response: Array<{ id, character_name, poi_name, question, user_answer, gift_words, badge_name, status }>
```

#### 3.2.5 神交记录详情

```
GET /api/v1/encounter/{encounter_id}?user_id={userId}
Header: X-Tenant-ID (必填)
Response: { id, character_name, poi_name, question, user_answer, gift_words, badge_name }
```

### 3.3 知识库系统

系统内置详细的历史人物知识库（`knowledge_base.py`），包含以下人物：

| 人物 | 朝代 | 关联古迹 |
|---|---|---|
| 苏东坡（苏轼） | 北宋 | 惠州西湖、罗浮山、西湖苏堤 |
| 许仙 | 南宋（传说） | 断桥 |
| 李白 | 唐 | （知识库预置，暂无关联古迹） |
| 杜甫 | 唐 | （知识库预置，暂无关联古迹） |
| 王维 | 唐 | （知识库预置，暂无关联古迹） |
| 辛弃疾 | 南宋 | （知识库预置，暂无关联古迹） |

每位人物知识库包含：
- 基本信息（姓名、字号、朝代、生卒年、籍贯）
- 性格特征
- 生平大事
- 代表作品
- 人生哲学/名言
- 人生挑战
- 语言风格描述
- 特定地点记忆（如苏东坡的惠州时期）

### 3.4 AI Prompt 引擎

#### 阶段一：召唤降临（开场白生成）

```text
系统提示词：基于知识库构建完整人物人格（含基本信息、性格、生平、作品、哲学、语言风格、地点记忆）
用户提示词：要求生成包含时间感、地点感、个人感的开场白 + 开放式情境问题
约束：150字以内，半文言文风格，必须以问题结尾
```

#### 阶段二：生成赠语

```text
系统提示词：同上人物人格
用户提示词：根据用户作答的主观情感，撰写抚慰/共鸣/赋力的赠语
约束：80字以内，融入历史经历/典故/诗词，禁止现代术语
```

#### 阶段三：自由追问（RAG 防幻觉）

```text
系统提示词：人物人格 + 认知锁定在去世年份之前
用户提示词：审慎回应追问，基于真实历史经历
规则：
1. 超出认知范围 → "此事未见记载" / "此物非我朝所有"
2. 无法考证的具体数据 → "未见文献明确记载，不敢断言"
3. 严禁承认 AI 身份
4. 100字以内
```

---

## 4. 功能模块二：名人对话

### 4.1 核心业务流程

```text
【用户输入/选择名人名字】 → 【AI 研究名人资料（生成结构化 JSON）】 →
【AI 生成名人开场白】 → 【多轮自由对话】 → 【对话≥2轮后可生成精神名片】
```

### 4.2 名人研究引擎

* 用户输入任意名人名字（中外古今均可）
* AI 实时搜索并整理名人资料，输出结构化 JSON：
  - 基本信息（姓名、时代、国籍、身份）
  - 性格特点（4项）
  - 重要事件（5项）
  - 人生哲学/名言（3项）
  - 说话风格
  - 人生挑战（3项）
  - 主要成就（3项）
  - 心理特征、认知风格
* 研究结果缓存于内存（重启清空）
* JSON 解析失败时自动降级为基本信息

### 4.3 API 接口规范

#### 4.3.1 开始对话

```
POST /api/v1/celebrity/start
Body: { "user_id": string, "celebrity_name": string }
Response: { "encounter_id": int, "celebrity_name": string, "identity": string, "era": string, "opening": string }
```

#### 4.3.2 对话

```
POST /api/v1/celebrity/chat
Body: { "encounter_id": int, "message": string }
Response: { "reply": string, "message_count": int }
```

* 支持多轮对话（内存保存最近 10 条历史）
* `message_count` 返回用户已发送消息数（用于前端判断是否可生成名片）

#### 4.3.3 生成精神名片

```
POST /api/v1/celebrity/generate-card
Body: { "encounter_id": int }
Response: { "gift_words": string, "badge_name": string, "celebrity_name": string, "identity": string, "era": string }
```

* 前置条件：用户至少发送 2 条消息
* AI 根据对话历史生成赠语（80字以内）+ 精神徽章（4-8字）

#### 4.3.4 对话记录列表

```
GET /api/v1/celebrity/list?user_id={userId}
Response: Array<{ id, character_name, identity, gift_words, badge_name, status }>
```

#### 4.3.5 对话详情

```
GET /api/v1/celebrity/{encounter_id}
Response: { id, character_name, identity, gift_words, badge_name, status }
```

### 4.4 预设推荐名人

前端预置 12 位推荐名人供快速选择：

苏东坡、李白、乔布斯、爱因斯坦、比尔·盖茨、拿破仑、达·芬奇、孔子、特斯拉、曹操、富兰克林、麦克阿瑟

---

## 5. 功能模块三：技术埋点系统

### 5.1 API 接口

```
POST /api/v1/track
Header: X-Tenant-ID (可选，默认 "default")
Body: { "event_type": string, "event_key": string, "payload": string }
Response: { "success": true, "status": "event_tracked" }
```

### 5.2 事件类型

| event_type | 说明 |
|---|---|
| `view` | 页面访问 |
| `click` | 动作触发 |
| `error` | 报错捕捉 |
| `api_perf` | 性能监控 |

### 5.3 前端埋点 SDK

前端封装 `emitTrackingEvent(eventType, eventKey, tenantId, payload)` 工具函数，异步上报不阻塞主流程，失败静默处理。

---

## 6. 功能模块四：导游讲解团系统

### 6.1 核心业务流程

```text
【导游确认身份】 → 【设定名人+年龄+古迹】 → 【创建讲解团，生成二维码】 →
【游客扫码/输入团码加入】 → 【AI 以名人视角生成开场讲解】 → 【游客可追问互动】
```

### 6.2 角色说明

| 角色 | 功能 |
|---|---|
| 导游 | 创建讲解团、设定名人/古迹参数、生成二维码、管理讲解团 |
| 游客 | 扫码或输入团码加入、听名人讲解、追问互动 |

### 6.3 导游设定界面

导游创建讲解团时需要设定：
1. **名人是谁**：选择或输入任意历史名人（如苏东坡、李白）
2. **什么时候的名人**：名人的年龄/时期（如"中年44岁"、"被贬惠州时期"）
3. **名胜古迹是哪个**：当前讲解的景点名称
4. **讲解团描述**（可选）：本次讲解的主题或特色

### 6.4 API 接口规范

#### 6.4.1 创建讲解团

```
POST /api/v1/guide/create-tour
Body: { "guide_id": string, "guide_name": string, "celebrity_name": string, "celebrity_age": string?, "poi_name": string, "description": string? }
Response: { "tour_id": int, "tour_code": string, "qr_content": string }
```

#### 6.4.2 加入讲解团

```
POST /api/v1/guide/join-tour
Body: { "user_id": string, "tour_code": string }
Response: { "tour_id": int, "guide_name": string, "celebrity_name": string, "celebrity_age": string?, "poi_name": string, "description": string? }
```

#### 6.4.3 名人讲解/追问

```
POST /api/v1/guide/narrate
Body: { "tour_id": int, "user_id": string, "message": string? }
Response: { "narration": string, "celebrity_name": string, "poi_name": string }
```

* 首次调用（无 message）：AI 以名人视角生成开场讲解
* 后续调用（有 message）：AI 以名人视角回答游客追问

#### 6.4.4 导游讲解团列表

```
GET /api/v1/guide/my-tours?guide_id={guideId}
Response: Array<{ id, celebrity_name, celebrity_age, poi_name, tour_code, status, participant_count, description }>
```

#### 6.4.5 关闭讲解团

```
POST /api/v1/guide/close-tour
Body: { "tour_id": int, "guide_id": string }
Response: { "success": true, "message": string }
```

### 6.5 二维码生成

* 前端使用 `qrcode` 库生成 Canvas 二维码
* 二维码内容为前端 URL：`{origin}/#/guide/join/{tour_code}`
* 二维码样式：深色前景（stone-900）+ 琥珀色背景（amber-50）
* 支持复制团码和分享功能

### 6.6 数据库 Schema

```sql
CREATE TABLE guide_tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guide_id VARCHAR(100) NOT NULL,       -- 导游用户ID
    guide_name VARCHAR(50) NOT NULL,      -- 导游姓名
    celebrity_name VARCHAR(50) NOT NULL,  -- 名人姓名
    celebrity_age VARCHAR(50),            -- 名人年龄/时期
    poi_name VARCHAR(100) NOT NULL,       -- 名胜古迹名称
    tour_code VARCHAR(20) NOT NULL UNIQUE,-- 讲解团唯一码（6位）
    description TEXT,                     -- 讲解团描述
    status VARCHAR(20) DEFAULT 'active',  -- active / closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    participant_count INTEGER DEFAULT 0   -- 参与人数
);
```

### 6.7 AI 讲解 Prompt 策略

* 优先使用内置知识库（苏东坡、李白等）构建详细人物人格
* 无内置知识库时，调用名人研究引擎动态生成人物资料
* 讲解规则：第一人称视角、融入个人经历、半文言文风格、200字以内
* 支持多轮追问，保留最近10条对话历史

---

## 7. 数据库 Schema

### 6.1 characters 表（古迹与古人配置）

```sql
CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(50) NOT NULL,       -- 租户ID
    poi_name VARCHAR(100) NOT NULL,       -- 古迹/景点名称
    latitude REAL,                        -- 围栏中心纬度
    longitude REAL,                       -- 围栏中心经度
    radius INTEGER DEFAULT 500,           -- 围栏半径（米）
    character_name VARCHAR(50) NOT NULL,  -- 古人姓名
    avatar_url VARCHAR(255),              -- 头像 URL
    system_prompt TEXT,                   -- 人格 Prompt（备用）
    opening_speech TEXT,                  -- 预设开场白（备用，实际由 AI 生成）
    question TEXT                         -- 预设问题（备用，实际由 AI 生成）
);
```

### 6.2 encounters 表（用户神交/对话资产）

```sql
CREATE TABLE encounters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(50) NOT NULL,       -- 租户ID（名人对话固定为 "celebrity_chat"）
    user_id VARCHAR(100) NOT NULL,        -- 用户唯一标识
    character_name VARCHAR(50) NOT NULL,  -- 古人/名人姓名
    poi_name VARCHAR(100) NOT NULL,       -- 古迹名称 / 名人身份标签
    question TEXT NOT NULL,               -- 古人提问 / 名人开场白
    user_answer TEXT,                     -- 用户作答内容
    gift_words TEXT,                      -- 专属赠语
    badge_name VARCHAR(100),              -- 精神徽章名称
    status VARCHAR(20) DEFAULT 'summoned' -- 状态：summoned / chatting / completed
);
```

### 6.3 tracking_logs 表（埋点审计）

```sql
CREATE TABLE tracking_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_key VARCHAR(100) NOT NULL,
    payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 种子数据

系统启动时自动检测并插入 4 条古人配置：

| 租户 | 古迹 | 古人 | 围栏坐标 |
|---|---|---|---|
| tenant_huizhou_gov | 惠州西湖 | 苏东坡 | (23.0818, 114.3975) r=500m |
| tenant_hangzhou_gov | 断桥 | 许仙 | (30.2590, 120.1485) r=300m |
| tenant_huizhou_gov | 罗浮山 | 苏东坡 | (23.2833, 114.0167) r=1000m |
| tenant_hangzhou_gov | 西湖苏堤 | 苏东坡 | (30.2400, 120.1400) r=500m |

---

## 7. 前端页面结构

### 7.1 页面路由

| 页面 | 路由标识 | 功能 |
|---|---|---|
| 首页 | `home` | 三大功能入口（名人对话 + 导游讲解 + 古迹神交） |
| 神交页 | `encounter` | 完整古迹神交业务闭环 |
| 人生地理志 | `geography` | 用户所有神交记录与徽章墙 |
| 精神名片（古迹） | `share` | 古迹神交精神名片展示与分享 |
| 名人入口 | `celebrity-entry` | 搜索/选择名人 |
| 名人对话 | `celebrity-chat` | 与名人多轮对话 |
| 精神名片（名人） | `celebrity-card` | 名人对话精神名片展示与分享 |
| 名人记录 | `celebrity-history` | 名人对话历史记录 |
| 导游入口 | `guide-entry` | 导游身份确认 + 功能入口 |
| 导游设定 | `guide-setup` | 设定名人/古迹/创建讲解团 |
| 二维码展示 | `guide-qrcode` | 展示讲解团二维码供游客扫描 |
| 我的讲解团 | `guide-tours` | 导游的讲解团列表管理 |
| 加入讲解团 | `guide-join` | 游客输入团码加入 |
| 讲解体验 | `guide-tour-view` | 游客听名人讲解+追问 |

### 7.2 首页功能入口

1. **名人对话入口**（突出展示）：跳转名人搜索/选择页
2. **扫描古迹二维码**：模拟扫码触发
3. **地理定位寻觅古迹**：调用设备 GPS 定位
4. **手动选择古迹列表**：惠州西湖、断桥、罗浮山、西湖苏堤
5. **人生地理志入口**：查看历史记录

### 7.3 交互状态机

#### 古迹神交状态流转

```
arriving（时空裂缝动画 2s）→ summoned（展示开场白+问题，等待作答）→ rewarded（展示赠语+徽章+追问区）
```

#### 名人对话状态流转

```
loading（研究名人资料）→ chatting（多轮对话）→ completed（生成名片）
```

### 7.4 分享机制

* 优先使用 Web Share API（`navigator.share`）
* 降级方案：复制文本到剪贴板
* 分享内容包含：古迹/名人名称、赠语、徽章称号

---

## 8. AI 大模型接入

### 8.1 模型配置

| 配置项 | 值 |
|---|---|
| 模型 | MiMo-V2.5-Pro |
| API 地址 | `https://token-plan-cn.xiaomimimo.com/v1/chat/completions` |
| 超时时间 | 60 秒 |
| 默认 temperature | 0.8（开场白 0.85，追问 0.7，研究 0.3） |
| 默认 max_tokens | 2000（研究 4000） |

### 8.2 调用方式

* **单轮调用** `call_ai(system_prompt, user_message)`：用于开场白生成、赠语生成、名人研究
* **多轮调用** `call_ai_with_history(system_prompt, messages)`：用于自由追问、名人对话

### 8.3 容错机制

* 开场白/赠语生成：失败自动重试 3 次
* 超时/HTTP 错误/异常：统一返回 `None`，由路由层返回 503
* 名人研究 JSON 解析失败：降级为基本信息模板

---

## 9. 中间件与安全

### 9.1 全局异常捕捉中间件

* 捕获所有未处理异常
* 服务端记录完整堆栈日志
* 客户端返回友好错误信息：`"时空裂缝出现剧烈波动，千年的回音在时空中迷失了，请稍后再试。"`
* 错误码：`TIMETRAVEL_CORE_ERROR`

### 9.2 多租户安全拦截

* 所有古迹神交 API 强制要求 `X-Tenant-ID` Header
* 空值/缺失返回 400 错误
* 跨租户数据访问返回 403/404
* 日志记录所有越权尝试

### 9.3 CORS 配置

* 允许所有来源（`allow_origins=["*"]`）
* 允许所有方法和头部
* 允许携带凭证

---

## 10. 移动端适配

### 10.1 Capacitor 配置

* App ID: `com.ancientencounter.app`
* 平台: Android
* 地理定位插件: `@capacitor/geolocation`

### 10.2 UI 设计规范

* 水墨美学质感，深色主题（stone/black 色系）
* 琥珀色（amber）作为强调色
* 全局圆角卡片设计
* 动画：脉冲、旋转加载、缩放反馈
* 字体：衬线体（font-serif）用于古风文案
* 响应式布局，移动端优先

---

## 11. 健康检查

```
GET /health
Response: { "status": "ok", "service": "ancient-encounter" }
```

---

## 12. 项目结构

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口，路由注册，启动初始化
│   │   ├── database.py          # SQLAlchemy 引擎与会话管理
│   │   ├── ai_client.py         # MiMo AI 大模型 API 客户端
│   │   ├── celebrity_engine.py  # 名人研究引擎（资料生成+人格构建+名片生成）
│   │   ├── knowledge_base.py   # 历史人物知识库 + Prompt 构建器
│   │   ├── seed.py              # 种子数据初始化
│   │   ├── middleware/
│   │   │   ├── tenant.py        # 多租户 Header 拦截
│   │   │   └── error_handler.py # 全局异常中间件
│   │   ├── models/
│   │   │   ├── character.py     # 古人配置 ORM
│   │   │   ├── encounter.py     # 神交记录 ORM
│   │   │   ├── guide_tour.py    # 导游讲解团 ORM
│   │   │   └── tracking_log.py  # 埋点日志 ORM
│   │   ├── routers/
│   │   │   ├── encounter.py     # 古迹神交路由
│   │   │   ├── celebrity.py     # 名人对话路由
│   │   │   ├── guide.py         # 导游讲解团路由
│   │   │   └── tracking.py      # 埋点路由
│   │   └── schemas/
│   │       ├── encounter.py     # 神交 DTO
│   │       ├── guide.py         # 导游讲解团 DTO
│   │       └── tracking.py      # 埋点 DTO
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 路由管理 + 租户映射
│   │   ├── main.tsx             # React 入口
│   │   ├── api/client.ts        # 后端 API 客户端封装
│   │   ├── components/
│   │   │   ├── PageHeader.tsx   # 通用页面顶部栏
│   │   │   ├── Divider.tsx      # 分隔线组件
│   │   │   └── LoadingOverlay.tsx # 全屏加载遮罩
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # 首页（三大入口）
│   │   │   ├── EncounterPage.tsx      # 古迹神交完整流程
│   │   │   ├── GeographyPage.tsx      # 人生地理志
│   │   │   ├── ShareCardPage.tsx      # 精神名片（古迹）
│   │   │   ├── CelebrityEntryPage.tsx # 名人搜索/选择
│   │   │   ├── CelebrityChatPage.tsx  # 名人多轮对话
│   │   │   ├── CelebrityCardPage.tsx  # 精神名片（名人）
│   │   │   ├── CelebrityHistoryPage.tsx # 名人对话记录
│   │   │   ├── GuideEntryPage.tsx     # 导游入口/身份确认
│   │   │   ├── GuideSetupPage.tsx     # 导游设定讲解团
│   │   │   ├── GuideQRCodePage.tsx    # 二维码展示页
│   │   │   ├── GuideToursPage.tsx     # 导游讲解团列表
│   │   │   ├── GuideJoinPage.tsx      # 游客输入团码加入
│   │   │   └── GuideTourViewPage.tsx  # 游客讲解体验页
│   │   └── utils/
│   │       ├── tracker.ts       # 埋点 SDK
│   │       └── userId.ts        # 用户ID生成
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── capacitor.config.ts
└── PRD.md
```

---

## 13. 运行方式

### 后端启动

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### Android 构建

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```
