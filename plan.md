# Plan (female_menstrual_record_819e28)

约定：
- 用 `- [ ]` / `- [x]` 作为打勾（完成后再改为 `- [x]`）
- 默认优先级：P0 > P1 > P2（先闭环、再增强、最后扩展）

## Dev 集成（Remix + Taro）
- [x] 约定统一入口：`http://localhost:5173/`（Remix landing）与 `http://localhost:5173/app`（Taro H5）
- [x] `/app` 在 Taro 首次未产出 `public/app/index.html` 时给出“正在构建…”占位页
- [x] `pnpm run dev` 同时启动 Remix dev + Taro H5 静态构建 watcher（不依赖 Taro dev server）
- [x] 规避 Taro 构建阶段的 `system-configuration` Rust panic：H5/小程序构建统一加 `--no-check`
- [ ] 修复/确认 Remix landing 样式稳定加载（确保不受 `/app/*` 规则影响）
- [ ] 验证：修改 Taro 页面样式后刷新 `http://localhost:5173/app` 可见最新变化

## Taro 体验（onboarding / login / record）
- [x] Login（邮箱验证码）交互与视觉：6 位验证码输入、大点击区域、冷却倒计时、层级与排版优化
- [x] Onboarding：进度条、可搜索多选、总结页跳转编辑、提交前确认页
- [x] Onboarding 视觉精调：顶部模块更紧凑（内边距/高度）；摘要列表更紧凑且编辑入口在每项右侧
- [x] Daily Record 页面：布局与可用性优化（移动端适配、信息层级、底部固定操作栏）
- [ ] 按 `USER_FLOW_V2` / `USER_FLOW_MINIPROGRAM_DAILY` / `QUESTIONNAIRE_V2` 补齐缺失流程与接口联调（P0）
- [ ] 再找 10 个最明显且可修复的问题逐一优化（对齐设计/交互一致性）（P1）

## Taro 基础组件重构（对齐 DESIGN.md 的 Calm / Scientific / Minimal / Warm neutral）
- [x] 设计 Token：颜色/字号/间距/圆角/阴影/动效（Less mixins + 全局规范）
- [x] FCPressable：统一按压反馈（hoverClass + 缩放/高光）
- [x] FCButton：主按钮/次按钮/幽灵按钮/禁用/加载/全宽
- [x] FCTextButton：文字按钮（用于“重新发送/修改邮箱”一类动作）
- [x] FCTextField：输入框（label/helper/error + 聚焦态）
- [x] FCCodeInput：6 位验证码输入（大点击区域 + 自动聚焦 + 连续输入反馈）
- [x] FCOptionCard：单选/多选卡片（勾选反馈、按压反馈）
- [x] FCOptionCard 精调：高度更紧凑；文字与勾选上下留白视觉对称、点击区域稳定
- [x] FCChip：标签选择（选中态/禁用态/删除态）
- [x] FCPickerField：Picker 的统一触发样式（像输入框但可点击）
- [x] FCProgress：进度条（数值 + 平滑宽度过渡）
- [x] FCActionBar：底部固定操作栏（安全区/阴影/动效）
- [x] 组件迁移：Login / Onboarding / Daily(Home) / AppIndex 全部替换为 FC* 组件
- [x] 文档：新增 `apps/app/src/ui/README.md`（用法 + 规范 + 动效原则）
- [x] 动效：页面进入 `fc-appear` + 提交流程 loading spinner + 温和错误恢复 notice

---

## 借鉴旧小程序 IA：交互优化空间（先定规范再补模块）

旧小程序 IA（来自 `mini-program/miniprogram/app.json`）：
- Tab：每日（home）/ 百科（encyclopedia）/ 分析（analyze）
- 系统页：登录（login）、设置（setting）、反馈（feekback）、分享（share/webview）、初始化补录（initData）

新的 Taro 现状（来自 `apps/app/src/app.config.ts`）：
- 仅 index/login/onboarding/home；无 TabBar；无 analyze/setting/feedback/share/export/initData

交互优化方向（全局约束）：
- [x] 系统级入口常驻：设置/反馈不应藏在深层（右上角 icon 或个人入口）
- [x] 保存动作可反馈：loading/禁用/失败可重试；失败不丢（尽量 inline notice，少用打断式 toast）
- [x] 编辑可恢复：onboarding/daily 都要有“返回/放弃修改”的一致规则
- [x] 日期可浏览：不仅能选日期，还要能看见“哪些天有记录/出血”（减少盲点）
- [ ] 短路径：常用动作（今日记录、补录、反馈、导出、分享）<= 2 次点击触达

---

## Remix 端 API 补齐（先定义契约，再实现/迁移）

现状：
- Remix 端已有：`/api/auth/*`、`/api/onboarding/v2/*`（见 `app/routes/api.*`）
- 但旧小程序的关键能力（menstrual/analysis/share/export/feedback/products/user）在 Remix 端尚未补齐同源 `/api/*`，会阻塞 Taro H5/小程序对接与 Remix 分享页实现

目标：
- Taro（H5/小程序）统一走同一套 `/api/*` 契约（同源或配置域名）
- Remix 页面（如 `/share/:code`）也复用同一套服务端 API/数据结构

### API 统一返回结构（建议沿用旧小程序后端格式，便于迁移）
- [x] 定义：`ApiResponse<T> = { code: number; message: string; data?: T }`
  - `code=200` 成功；非 200 失败（message 给用户可读文案）
  - 兼容策略：保留现有 `{success: boolean}` 的 auth/onboarding，不强行一次性重构；新模块先用 `ApiResponse<T>`

### 需要新增的 Remix API（路由文件名建议）

#### 1) Menstrual（日记录）
数据结构（对齐旧小程序 `mini-program/miniprogram/api/menstrual.ts`）：
- [x] `MenstrualEventType = 'pad' | 'tampon' | 'symptom'`
- [x] `MenstrualColor = 'pink' | 'red' | 'rust' | 'dark' | 'brown'`
- [x] `MenstrualEventInput`：
  - `eventTime: string`（ISO 或 HH:mm，后端统一落成 ISO）
  - `eventType: MenstrualEventType`
  - `productType? brand? series? lengthMm? model? absorbency? color? volumeMl? symptomName?`
- [x] `MenstrualDailySummary`：`{ date: string; hasBleeding: boolean; totalVolumeMl: number; dayColor: MenstrualColor | null }`
- [x] `MenstrualDailyDetail`：
  - `{ date; hasBleeding; totalVolumeMl; dayColor; clotCounts: {small:number; large:number}; events: Array<{id:number} & MenstrualEventInput> }`

API：
- [x] `GET /api/menstrual/daily?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - resp：`ApiResponse<MenstrualDailySummary[]>`
  - 路由：`app/routes/api.menstrual.daily.ts`
- [x] `GET /api/menstrual/daily/:date`
  - resp：`ApiResponse<MenstrualDailyDetail>`
  - 路由：`app/routes/api.menstrual.daily.$date.ts`
- [x] `PUT /api/menstrual/daily/:date`
  - body：`{ hasBleeding: boolean; events: MenstrualEventInput[] }`
  - resp：`ApiResponse<{ date: string }>`
  - 路由：同上（Remix action 内按 `request.method` 分发 PUT）
  - 备注：neon-http driver 对事务支持不稳定，当前实现为“顺序写入 + best-effort fallback”

#### 2) Products（品牌/系列）
数据结构（对齐旧小程序 `mini-program/miniprogram/api/products.ts`）：
- [x] `ProductType = 'pad' | 'tampon'`
- [x] `ProductBrand = { id:number; type:ProductType; name:string; sort:number }`
- [x] `ProductSeries = { id:number; brandId:number; name:string; sort:number }`

API：
- [x] `GET /api/products/brands?type=pad|tampon` → `ApiResponse<ProductBrand[]>`
  - 路由：`app/routes/api.products.brands.ts`
- [x] `GET /api/products/brands/:brandId/series` → `ApiResponse<ProductSeries[]>`
  - 路由：`app/routes/api.products.brands.$brandId.series.ts`

#### 3) Analysis（分析）
数据结构（对齐旧小程序 `mini-program/miniprogram/api/analysis.ts`）：
- [x] `AnalysisOverview`
- [x] `AnalysisCycleList`（分页）
- [x] `AnalysisCycleDetail`
- [x] `AnalysisHealthScoreDetail`

API：
- [x] `GET /api/analysis/overview?limit=number` → `ApiResponse<AnalysisOverview>`
  - 路由：`app/routes/api.analysis.overview.ts`
- [x] `GET /api/analysis/health-score-detail?limit=number` → `ApiResponse<AnalysisHealthScoreDetail>`
  - 路由：`app/routes/api.analysis.health-score-detail.ts`
- [x] `GET /api/analysis/cycles?page=number&pageSize=number` → `ApiResponse<AnalysisCycleList>`
  - 路由：`app/routes/api.analysis.cycles.ts`
- [x] `GET /api/analysis/cycles/:cycleId` → `ApiResponse<AnalysisCycleDetail>`
  - 路由：`app/routes/api.analysis.cycles.$cycleId.ts`

#### 4) Share（分享：创建/获取）
数据结构（对齐旧小程序 `mini-program/miniprogram/api/share.ts`）：
- [x] `ShareCreateResp = { shareCode: string; expireAt: string; path: string }`
- [x] `ShareGetResp = { shareCode; type:'period'|'overview'; createdAt; expireAt; owner:{nickname;avatarUrl}; data: AnalysisCycleDetail | AnalysisOverview }`

API：
- [x] `POST /api/share` body：`{ type:'period'|'overview'; cycleId?:number; limit?:number }`
  - resp：`ApiResponse<ShareCreateResp>`
  - 路由：`app/routes/api.share.ts`
- [x] `GET /api/share/:code` → `ApiResponse<ShareGetResp>`
  - 路由：`app/routes/api.share.$code.ts`

#### 5) Export（导出 xlsx）
API（对齐旧小程序 `mini-program/miniprogram/api/export.ts`）：
- [ ] `GET /api/export/menstrual.xlsx?start&end`（二进制）
  - 路由：`app/routes/api.export.menstrual[.]xlsx.ts`
- [ ] `GET /api/export/overview.xlsx?limit`（二进制）
  - 路由：`app/routes/api.export.overview[.]xlsx.ts`
说明：
- 需要设置 `Content-Type` 与 `Content-Disposition`；Remix 端用 `loader` 返回 `ArrayBuffer/ReadableStream`

#### 6) Feedback（反馈）
数据结构（对齐旧小程序 `mini-program/miniprogram/api/feedback.ts`）：
- [x] `SubmitFeedbackPayload = { typeIndex:number; content:string; contact?:string; images?:string[]; meta?:Record<string,any> }`
- [x] `SubmitFeedbackResult = { id: string }`

API：
- [x] `POST /api/feedback` body：`SubmitFeedbackPayload` → `ApiResponse<SubmitFeedbackResult>`
  - 路由：`app/routes/api.feedback.ts`

#### 7) User（资料更新：Setting 必需）
现状：
- 已有 `/api/auth/me`（返回 authenticated + user）

建议新增（最小）：
- [x] `PATCH /api/user/profile` body：`{ displayName?: string; avatarUrl?: string }` → `ApiResponse<{ ok:true }>`
  - 路由：`app/routes/api.user.profile.ts`
  - Setting 页面用它来更新昵称/头像（避免把“用户资料”塞进 auth 模块）

### OpenAPI 文档（可选但强烈建议）
- [x] 升级 `app/routes/api.openapi.json.ts`：支持 `api.*.tsx`、支持动态段（如 `$date` → `{date}`）、支持 `[.]` 点文件名
  - 目的：让 Taro/Remix/后端对齐时有“可浏览的契约清单”

### 数据库迁移与联通验证
- [x] 新增迁移：`drizzle/0002_menstrual_products_feedback.sql`（daily/event/products/feedback）
- [x] 新增迁移：`drizzle/0003_analysis_cycles_share.sql`（cycle + share）
- [ ] 执行迁移：`pnpm db:migrate:api`（应用 0003）
- [ ] Smoke test（Remix dev + Neon）：auth → PUT daily → GET daily → GET range → GET analysis overview/cycles（通过）

---

## P0 按顺序补齐（核心闭环 / 数据可靠 / 自助能力）

### P0-1 信息架构对齐：TabBar + 系统页骨架
- [x] 增加 TabBar：每日 / 百科 / 分析（先以自定义底部导航 `FCTabBar` 形式落地，后续再升级为原生 tabBar）
  - 改动：`apps/app/src/app.config.ts`、`apps/app/src/ui/tabBar.tsx`
  - 新增页面 skeleton：
    - `apps/app/src/pages/analyze/index.tsx`
    - `apps/app/src/pages/encyclopedia/index.tsx`
- [x] 新增系统页：设置 / 反馈
  - 新增页面：
    - `apps/app/src/pages/setting/index.tsx`
    - `apps/app/src/pages/feedback/index.tsx`
  - 入口：Tab 页右上角 icon（⚙），以及 Home 顶部提供可触达入口
- [x] 路由/鉴权守卫统一（避免“看得到但进不去/进去了又跳回”的割裂）
  - 规则：
    - 未登录：只能访问 login
    - 已登录未 onboarding：强制 onboarding
    - 已完成：进入 Tab（默认每日）
  - 改动：`apps/app/src/utils/authGuard.ts`（扩展为可复用 page-level guard）

### P0-2 Daily：从本地存储升级为服务端（本地 draft 兜底）
- [x] 新增 menstrual service（对齐旧小程序 API）
  - 新文件：`apps/app/src/services/menstrual.ts`
  - 接口：
    - `GET /api/menstrual/daily?start&end`（区间 summary：用于日历/标记）
    - `GET /api/menstrual/daily/:date`（单日 detail）
    - `PUT /api/menstrual/daily/:date`（保存）
- [x] 改造 `dailyRecordRepo`：远端主存 + 本地 draft + 可重试 submit
  - 改动：`apps/app/src/services/dailyRecordRepo.ts`
  - 约定：
    - `load(date)`：优先远端；失败回退本地 draft
    - `saveDailyRecordDraft()`：输入变化就落本地（轻量写）
    - `submitDailyRecord()`：PUT 远端；失败保留 draft，并返回结构化错误给 UI
- [x] Home 接入真实错误恢复（当前 FCNotice 仅展示；需接入真实 error 与重试）
  - 改动：`apps/app/src/pages/home/index.tsx`
  - 验收：
    - 断网/500：提示“数据还在，可稍后重试”
    - 恢复网络：点击提交成功，draft 清空或与远端对齐

### P0-3 日期可浏览：最近 30/60 天概览（轻量日历条）
- [x] 在 Home 顶部增加“最近 N 天概览条”
  - 数据：用 `GET /api/menstrual/daily?start&end`
  - UI：横滑日期胶囊/点阵；区分“出血/有记录/无记录”；点击切到当日
  - 实现方式：
    - 先内联到 `apps/app/src/pages/home/index.tsx`
    - 如复杂再抽组件：`apps/app/src/ui/FCCalendarStrip.tsx`
  - 验收：不用打开日期选择器也能快速定位“上次出血/有记录”的那天

### P0-4 设置页最小版：退出登录 + 可见性开关 + 研究同意状态
- [x] Settings 页面与分组结构
  - 新增：`apps/app/src/pages/setting/index.tsx`
  - P0 功能：
    - 退出登录：清 `auth.token` → reLaunch `/pages/login/index`
    - 记录可见性：卫生巾/棉条/出血（写 storage；影响 Home UI）
    - 研究同意：展示 A0 结果；提供“去修改”跳转到 onboarding 对应题（复用 position）

### P0-5 反馈最小版：类型 + 文本 + 联系方式（草稿自动保存）
- [x] Feedback 页面
  - 新增：`apps/app/src/pages/feedback/index.tsx`
  - API：`POST /api/feedback`（对齐旧小程序）
  - 交互：
    - 草稿自动保存（离开页面不丢）
    - 提交成功清草稿，回到 Setting 或 toast + 返回

---

## P1（分析/分享/导出/产品：形成可见价值）

### P1-1 Analyze 最小版（先卡片化，再上图表）
- [x] 分析总览（overview）
  - API：`GET /api/analysis/overview`
  - UI：健康分、趋势状态、风险列表（可点击解释）
  - 页面：`apps/app/src/pages/analyze/index.tsx`
- [x] 周期列表 + 周期详情（detail）
  - API：`GET /api/analysis/cycles`、`GET /api/analysis/cycles/:id`
  - 交互：列表/详情 loading 与空态；返回保留上下文
  - 页面：`apps/app/src/pages/analyze/cycle/index.tsx`

### P1-2 Share：创建在 Taro、展示在 Remix（降低双端复杂度）
- [x] Taro：创建分享（复制链接/码）
  - API：`POST /api/share`（period/overview）
  - UI：复制 shareCode/链接；失败可重试
- [x] Remix：分享展示页（更适合跨端打开/可复制链接）
  - 路由：`/share/:code`
  - API：`GET /api/share/:code`

### P1-3 Export：导出 xlsx
- [ ] 导出入口（Taro）+ 下载/保存策略
  - API：`/api/export/menstrual.xlsx`、`/api/export/overview.xlsx`
  - H5：直接下载；小程序：保存文件/转发（按目标端再细化）

### P1-4 Products：品牌/系列联动（可选填，不阻塞 P0）
- [ ] products service（brands/series）
- [ ] Settings 保存默认偏好；Home 记录事件可一键带入（减少重复输入）

---

## P2（内容/补录/高级记录/商业化）
- [ ] Encyclopedia：内容列表 + 详情（可先用 Remix 承载，Taro 只做入口）
- [ ] InitData：补录历史记录（批量补几天；提交前摘要确认）
- [ ] 高级记录：血量估算/颜色/血块等级/卫生用品模式（滑块/卡片/涂抹）+ 更强日历可视化
- [ ] 会员/支付：若要保留商业化路径，再引入 membership/pay；否则从 IA 中移除相关入口
