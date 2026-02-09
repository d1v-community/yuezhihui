# Plan（UX 优化 / 基于现有架构）

约定：
- 用 `- [ ]` / `- [x]` 作为打勾（完成后再改为 `- [x]`）
- 优先级：P0（必须闭环）> P1（增强体验）> P2（可选扩展）
- 尽量复用现有 Taro 页面与 `apps/app/src/ui` 的 FC 组件体系；不新增依赖

目标（本轮）：
- 主页「按日记录」的日历条：把“红点”升级为“量筒（量桶）”式血量指示器，并细化视觉/交互规范
- 将「已提交/未提交」「有改动/未改动」等状态提示改为更轻量的 icon 交互（减少文字噪音）
- Daily Record 页面不再每次询问“有出血吗？”：改为基于“实际血量事件”自动推断出血；并保证日历条量筒实时联动
- 首次进入页面时，通过 API 拉取最近一段时间血量历史渲染量筒；提供过渡加载态

非目标（暂不做）：
- 不重做数据模型、不改动后端 API 形态（优先在前端派生/兼容）
- 不引入第三方 icon 库（优先用现有样式 + 字符图标/自绘 View）

---

## P0-1 日历 Tab：红点 → 量筒指示器（细化设计）

现状：
- 日历条位于 `apps/app/src/pages/home/index.tsx`，每个日期下方使用 `calDot`/`calDotOn` 表示“有记录/出血”
- 概览数据来自 `getMenstrualDailyRange(start, end)`（`apps/app/src/services/menstrual.ts`）

设计稿口径（量筒/量桶）：
- 形态：竖向小量筒（建议宽 8~10px、高 14~18px），有边框、有圆角、内部有填充液面
- 状态（至少 4 档）：
  - 空（0）：仅边框 + 透明底（或极浅底色）；不显示液面
  - 低（>0 且 <= 25%）：底部少量填充 + 液面线
  - 中（25%~70%）：中等高度填充
  - 高（>=70%）：接近满；顶部保留 1~2px 空隙避免“溢出”视觉
- 颜色：
  - 默认用“经血色系”渐变（浅→深），可选用 `dayColor`（后端已有字段）映射到填充色
  - 未激活日期：整体更淡（降低 alpha）；激活日期：边框/填充更清晰
- 语义：
  - “有记录但无血量”（例如仅症状）：显示空量筒，但边框加亮（区别于完全无数据）
  - “完全无数据”：显示占位（可为极淡空量筒或隐藏量筒，仅保留布局一致性）

血量 → 填充高度映射（建议）：
- 以 `totalVolumeMl` 映射到 0~1 的 `fillRatio`
- 需要一个 UI-only 的 `MAX_ML`（例如 40mL，与当前页面 `volumeFill` 的 max 对齐）
- `fillRatio = clamp(totalVolumeMl / MAX_ML, 0, 1)`
- 低档需要最小可见高度（例如 `minFillPx = 2`），避免 >0 但看不见

实现拆解：
- [x] 新增可复用组件（建议放在 UI 目录，便于复用到其它地方）
  - 组件名建议：`FCVolumeVial` / `FCVolumeCylinder`
  - 位置建议：`apps/app/src/ui/volumeVial.tsx` + `apps/app/src/ui/volumeVial.less` + 在 `apps/app/src/ui/index.ts` 导出
  - Props 建议：
    - `volumeMl: number`
    - `hasData?: boolean`（区分“无数据” vs “有记录但 0 血量”）
    - `active?: boolean`
    - `loading?: boolean`（用于首次拉取概览数据时的骨架/闪烁）
    - `color?: MenstrualColor | null`（可选）
- [x] 替换日历条渲染：`calDot` → `FCVolumeVial`
  - 文件：`apps/app/src/pages/home/index.tsx`
  - 同步更新文案提示：圆点提示改成量筒含义（例：“量筒高度表示该日总血量（示意）”）
- [x] 样式与对齐：更新 `apps/app/src/pages/home/index.less`
  - 保证日期数字与量筒垂直对齐、点击热区不变
  - 激活态（selectedDate）边框加粗/发光不刺眼（符合 Calm / Minimal）

验收标准：
- [x] 最近 30 天日历条中，每天都能稳定显示一个量筒（空/低/中/高）
- [x] 选择某天后，量筒激活态清晰但不跳动；滚动条不卡顿
- [x] 有血量时，不再出现红点；改由量筒填充表达强弱

---

## P0-2 状态提示：提交/未改动 → icon 化（简化交互）

现状：
- `pillRow` 使用 `FCChip` 显示：`已提交/未提交`、`有改动/未改动`、以及“仅可记录今天及之前”
- ActionBar 主按钮为文字：“提交 / 确认更改 / 提交中...”

目标：
- 状态提示去文字化、信息更聚合：用 1~2 个 icon（+可选极短说明）代替整行文字 chip
- 不降低可理解性：icon 需有可读的辅助说明（例如同一行保留一条短句、或点击/长按弹出说明）

交互建议（不引入 icon 库的前提）：
- 使用 `Text` + 字符图标（示例：`✓` 提交成功、`✎` 有改动、`⏳` 提交中、`⚠` 失败）
- 或用 `View` 自绘小圆点/对勾（与现有 design tokens 一致）

实现拆解：
- [x] 将 `pillRow` 改为“状态 icon 行”
  - 文件：`apps/app/src/pages/home/index.tsx`
  - 规则建议：
    - 已提交且无改动：显示 `✓`（可绿色/中性）+ 可选“已提交”极短文案（可隐藏）
    - 有未提交改动：显示 `✎`（强调色）+ 可选“未提交改动”
    - 提交中：显示 spinner 或 `⏳`
    - “仅可记录今天及之前”可移到更弱的 hint（减少占位）
- [x] 主提交按钮：保持为按钮，但可加 icon（左侧）提升识别
  - 仍建议保留 2~4 字文案（例如“提交/更新”），避免纯 icon 导致误触

验收标准：
- [x] 首页顶部信息密度明显下降（少一行或更紧凑）
- [x] 用户仍能在 1 秒内判断：该日是否已提交、当前是否有未提交改动

---

## P0-3 去掉“有出血吗？”：改为血量驱动的自动推断 + 实时联动量筒

现状：
- 页面强制出现“有出血吗？”开关（关闭会清空事件）
- `addEvent` 时会将 `hasBleeding` 自动置 `true`（pad/tampon）
- 日历概览 `rangeMap` 仅在提交后对当天做 best-effort 更新；编辑过程不实时反映到日历条

目标：
- 页面默认不再询问“有出血吗？”
- 判定规则：只要检测到“实际血量”> 0（或存在 pad/tampon 且 volumeMl>0），即可认为有出血
- 日历条量筒实时更新：当用户在某天新增/删除/修改血量事件时，当天量筒立即变化（无需等待提交）
- 首次进入页面：先加载当日详情，再异步加载近段时间概览；概览加载期间量筒显示过渡态（loading）

规则定义（建议落地为纯函数，便于维护）：
- `deriveTotalVolumeMl(events) = sum(pad/tampon.volumeMl || 0)`
- `deriveHasBleeding(events) = deriveTotalVolumeMl(events) > 0`
- 提交时：以派生值覆盖 `record.hasBleeding`（保证后端语义一致）

实现拆解：
- [x] 移除/隐藏“有出血吗？”区块
  - 文件：`apps/app/src/pages/home/index.tsx`
  - 同时移除 `toggleBleeding` 相关交互（或保留但不在 UI 暴露）
- [x] 统一“出血”判定来源（事件 → 派生）
  - `addEvent/removeEvent` 后不再依赖手动 switch，而是由派生值决定提交 payload
  - 避免出现：用户删除所有血量事件但 `hasBleeding` 仍为 true 的状态
- [x] 日历条实时联动（关键）
  - 在 `record.events` 变化时（effect/memo），对 `rangeMap[record.date]` 做即时更新：
    - `totalVolumeMl = deriveTotalVolumeMl(record.events)`
    - `hasBleeding = totalVolumeMl > 0`（或同 derive）
  - 注意：这类“未提交的本地改动”仍应反映在 UI（符合你的“实时”诉求）
- [x] 概览 API 加载与加载态
  - 复用现有 `getMenstrualDailyRange(start, end)`（已经是“最近区间”API）
  - 增加 `rangeLoading` 状态：开始请求 → true；完成/失败 → false
  - `rangeLoading` 为 true 时，日历条量筒显示 skeleton/淡闪（不影响点击切换日期）

验收标准：
- [x] 页面不再出现“有出血吗？”提问开关
- [x] 新增一条血量事件后，当天日历量筒立即变高；删除血量事件后立即降低/变空
- [x] 首次进入页面时：日历条量筒有明确“正在加载概览”的过渡态，避免用户误以为无数据

---

## P0-4 导航体验：补齐缺少“返回 icon”的页面

排查结果（当前代码状态）：
- 缺少返回入口：
  - `apps/app/src/pages/setting/index.tsx`（设置页：目前只有标题/描述，没有返回 icon）
  - `apps/app/src/pages/feedback/index.tsx`（反馈页：目前只有标题/描述，没有返回 icon）
- 有返回但不是 icon（文字按钮）：
  - `apps/app/src/pages/analyze/cycle/index.tsx`（周期详情：存在“返回”按钮，但不是 icon）

TODO：
- [x] 为设置页增加左上角返回 icon：优先 `Taro.navigateBack()`，无 history 时 fallback 到 `/pages/home/index`
- [x] 为反馈页增加左上角返回 icon：优先 `Taro.navigateBack()`，无 history 时 fallback 到 `/pages/setting/index`
- [x] 将周期详情页的“返回”文字按钮替换为返回 icon（并统一样式/点击热区）

验收标准：
- [x] H5 环境下（无系统导航栏）也能一眼找到返回入口；点击返回行为符合预期（含 fallback）

---

## P0-5 顶部 14 日固定 Tab：数字 + 量筒，并支持内容区左右滑动切换日

目标：
- 顶部固定显示 14 个日期 Tab：上方日号数字 + 下方量筒（血量）
- 点击日期 Tab：选中该日（日期列表不滚动、不重排）
- 在日期条下方内容区左右滑动：前进/后退 1 日（等价切换 Tab）
- 量筒长按提示：显示该日 `totalVolumeMl`

实现拆解：
- [x] 将日期条改为固定 14 个并排（移除横向 ScrollView）
- [x] 内容区增加 swipe 手势：左右滑动切换前/后 1 日（到边界有 toast 提示）
- [x] 量筒长按提示：`${date} · ${totalVolumeMl}mL`

验收标准：
- [x] 点击任意 Tab 仅切换选中态与内容，顶部 14 日列表不发生位移/重排
- [x] 在内容区快速左右滑动可切换前后 1 天；垂直滚动不会误触发换日

---

## P0-6 Daily Record 信息布局调整（标签上移 + 状态/设置归位）

目标：
- [x] 删除底部“事件标签”模块
- [x] 将事件标签移动到「当日血量」进度条下方（更贴近“实时反馈”区域）
- [x] 将提交/改动状态组件放到“按日记录”标题右侧（减少中间占位）
- [x] 设置按钮移动到右上角（日期选择器右侧）

验收标准：
- [x] 页面底部不再出现独立“事件标签”模块；标签在顶部血量区域可见且可删除
- [x] 标题行右侧能快速看见“已保存/有改动”状态；右上角可快速进入设置

---

## P0-7 用户偏好：是否习惯使用卫生棉条（持久化开关）

背景：
- 80% 用户不一定使用卫生棉条；默认展示会增加认知负担
- 需要在设置页提供“我习惯用卫生棉条”开关；并持久化到 DB（跨端一致）

实现拆解：
- [x] 数据库：在 `users` 增加 `use_tampon boolean`（NULL 表示未设置）
  - 迁移：`drizzle/0004_user_preferences.sql`
- [x] 后端：对外返回/写入该字段（最小改动，复用现有接口）
  - `GET /api/auth/me`：返回 `user.useTampon`
  - `POST /api/auth/verify-login`：返回 `user.useTampon`
  - `PATCH /api/user/profile`：支持更新 `useTampon`
- [x] 设置页：新增“我习惯用卫生棉条”开关（保存到账号）
  - 文件：`apps/app/src/pages/setting/index.tsx`
  - 交互：保存失败回滚 + toast 提示；保存中禁用开关避免抖动
- [x] 按日记录页：根据 `useTampon` 决定是否展示“卫生棉条”模块
  - 文件：`apps/app/src/pages/home/index.tsx`
  - 规则：`useTampon !== false` 默认展示；从设置页返回时刷新一次

验收标准：
- [x] 用户关闭开关后，按日记录页不再出现“卫生棉条”模块（刷新/重进仍生效）
- [x] 用户打开开关后，按日记录页出现“卫生棉条”模块（无需清缓存）
- [x] 涉及 API/后端逻辑：完成一次 API 冒烟测试（本地请求能通 + 鉴权/错误码正确）再打勾

---

## P1（可选增强）
- [x] 量筒长按/点击显示该日 `totalVolumeMl`（轻提示，避免常驻文字）
- [x] 当日量筒可显示 `dayColor`（粉/红/锈红/深红/棕）作为填充色，提高信息密度
- [x] 若用户选择的日期不在已加载概览区间内，自动扩展拉取（例如始终保证覆盖 selectedDate±30 天）

---

## 开发自检（每次改动后）
- [x] `pnpm run typecheck`（0 error）
- [x] `pnpm run lint`（0 error）
- [x] API 冒烟测试：`node scripts/api_smoke_test.mjs`（包含 menstrual daily 的 GET/PUT/range + 鉴权 401）
- [x] `pnpm -C apps/app run build:h5`（确保 Taro H5 可编译）
- [x] 手动回归（最小闭环）：
  - [x] 切换日期（dirty 时的“放弃修改”确认逻辑仍正确）
  - [x] 添加/删除血量事件 → 日历量筒实时变化
  - [x] 提交成功/失败时状态 icon 与按钮状态正确
