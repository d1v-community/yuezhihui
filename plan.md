# Plan (female_menstrual_record_819e28)

## Dev 集成（Remix + Taro）
- [x] 约定统一入口：`http://localhost:5173/`（Remix landing）与 `http://localhost:5173/app`（Taro H5）
- [x] `/app` 在 Taro 首次未产出 `public/app/index.html` 时给出“正在构建…”占位页
- [x] `pnpm run dev` 同时启动 Remix dev + Taro H5 静态构建 watcher（不依赖 Taro dev server）
- [ ] 修复/确认 Remix landing 样式稳定加载（Tailwind CSS 不受 `/app/*` 规则影响）
- [ ] 验证：修改 Taro 页面样式后刷新 `http://localhost:5173/app` 可见最新变化

## Taro 体验（onboarding / login / record）
- [x] Login（邮箱验证码）交互与视觉：6 位验证码输入、冷却倒计时、层级与排版优化
- [x] Onboarding 流程：进度条、可搜索多选、总结页与“修改”跳转
- [x] Daily Record 页面：布局与可用性优化（移动端适配、信息层级）
- [ ] 按 `USER_FLOW_V2` / `USER_FLOW_MINIPROGRAM_DAILY` / `QUESTIONNAIRE_V2` 补齐缺失流程与接口联调
- [ ] 再找 10 个最明显且可修复的问题逐一优化（对齐设计/交互一致性）
