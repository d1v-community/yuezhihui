# 月知会 / FlowSense

<p align="center">
  <img src="./docs/assets/github-poster.svg" alt="月知会 FlowSense GitHub poster" width="100%" />
</p>

一个围绕女性月经与身体节律理解而设计的开源项目。

它不是只做“下次月经预测”的工具，而是一套把主观体感、出血强度、卫生用品使用、症状和长期趋势组织成可理解数据的记录系统。

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Remix](https://img.shields.io/badge/Remix-000000?logo=remix&logoColor=white)](https://remix.run/)
[![Taro](https://img.shields.io/badge/Taro-FF6A00?logo=wechat&logoColor=white)](https://taro.zone/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-1E1E1E?logo=drizzle&logoColor=C5F74F)](https://orm.drizzle.team/)
[![License: Apache 2.0](https://img.shields.io/badge/Code-Apache%202.0-D22128)](./LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC%20BY%204.0-8A2BE2)](./CONTENT_LICENSE.md)

</div>

## 项目定位

- 面向真实月经记录，而不是只做日期打卡。
- 强调“记录 -> 计算 -> 理解”的产品路径。
- 同时覆盖内容科普、记录工具、分析能力和跨端实现。
- 适合作为 FemTech、健康数据建模、跨端产品工程的开源样本。

## 你能在这个仓库里看到什么

- 一个对外展示的官网落地页：`/`
- 一个百科内容站：`/wiki`
- 一个问答页：`/faq`
- 一个下载页：`/download`
- 一个 Taro 产品前端：
  - H5 Web App
  - 微信小程序
- 一个 Remix 后端：
  - 认证
  - 用户资料
  - 记录与分析 API
  - 分享与百科内容服务
- 一个 Flutter 客户端原型/实现目录

## 核心特性

- 精细化经期记录：按天记录出血、用品、症状、情绪等维度。
- 强度建模：把“感觉”转成更可比较、更可追踪的数据。
- 周期分析：面向长期节律，而不是单次事件。
- 女性健康百科：将知识内容与产品体验放在同一项目里。
- 多端架构：Web、H5、小程序、Flutter 目录共存。
- 开源友好：仓库里保留了文档、脚本、迁移、部署配置。

## 技术架构

### Web / Backend

- `Remix` 负责官网、下载页、百科页和 `/api/*`
- `Tailwind CSS` 负责站点样式
- `Drizzle ORM` 管理数据库 schema 与迁移
- `JWT + Email Login` 支持认证链路

### Product Frontend

- `Taro` 是主产品前端
- 同一套产品 UI 主要面向：
  - H5 Web App
  - 微信小程序

### Mobile Exploration

- `Flutter` 目录用于移动端实验和实现延展

### Repo Strategy

- 单仓库管理官网、API、跨端产品和内容站
- 适合在一个项目里同时推进产品、内容和基础设施

## 仓库结构

```text
.
├── app/                     # Remix 应用：官网、百科、下载页、API
├── apps/app/                # Taro 应用：H5 + 微信小程序
├── apps/flutter_app/        # Flutter 客户端
├── app/content/wiki/        # 百科内容与导航
├── docs/                    # 文档与 GitHub 展示资源
├── drizzle/                 # SQL migrations
├── scripts/                 # 构建、迁移、种子、检查脚本
└── README.md
```

## 本地开发

### 前置要求

- Node.js 20+
- `pnpm`

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm run dev
```

常用命令：

```bash
pnpm run dev                # 默认开发入口
pnpm run dev:all            # Remix + Taro H5
pnpm run build              # 生产构建
pnpm run start              # 运行生产构建
pnpm run lint               # ESLint
pnpm run typecheck          # TypeScript 检查
```

## 数据库工作流

当前项目可以直接使用数据库迁移脚本。

```bash
pnpm run db:migrate
pnpm run db:seed
```

如果你们的环境已经安全管理好了 `DATABASE_URL`，这是最直接的方式。

同时仓库里也保留了 API 方式，供需要时使用：

```bash
pnpm run db:migrate:api
pnpm run db:seed:api
```

## 署名与使用规则

如果你使用本仓库代码或内容，请先区分三类资产：

- `代码`：采用 [Apache-2.0](./LICENSE)
- `百科内容、文案、图片等内容资产`：采用 [CC BY 4.0](./CONTENT_LICENSE.md)
- `月知会`、`FlowSense`、Logo、品牌表达：不随开源许可证授权，见 [TRADEMARK_POLICY.md](./TRADEMARK_POLICY.md)

### 我们希望你如何提到月知会

标准开源许可证不能强制所有下游在宣传页里给原项目打广告，但本仓库要求你：

- 保留源码和分发中的版权、许可证与 `NOTICE`
- 在使用内容资产时进行清晰署名
- 在提到项目来源时使用推荐表述：

```text
Based on the open-source Yuezhihui / FlowSense project by 月知会.
```

如果你在产品页、文档页、About 页或仓库 README 中保留这句署名，会更符合本项目预期。

## 环境变量

按需参考：

- [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

常见变量包括：

```env
APP_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret

# direct DB migrations
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
```

如果使用 API 迁移模式，再额外配置：

```env
PROJECT_ID=your_project_id
OPCODE_API_BASE=http://localhost:9191/api
AUTH_TOKEN=your_token
```

## 适合谁参考

- 想做女性健康 / 健康记录类产品的人
- 想看 Remix + Taro 如何共存的人
- 想看内容站、官网和产品前端如何放在一个仓库里的人
- 想研究月经记录与健康分析产品表达的人

## 文档入口

- [API 文档](./docs/API.md)
- [部署文档](./docs/DEPLOYMENT.md)
- [环境变量说明](./docs/ENVIRONMENT.md)
- [项目结构说明](./docs/PROJECT_STRUCTURE.md)
- [架构 ADR](./docs/architecture/adr/0005-taro-is-primary-frontend-remix-api-and-landing.md)

## 当前状态

这是一个持续演进中的项目，仓库内同时包含：

- 对外展示站点
- 产品前端
- 后端 API
- 百科内容
- 多端探索代码

因此它既是一个产品项目，也是一个工程样本。

## License

- 代码许可：见 [LICENSE](./LICENSE)
- 分发归属说明：见 [NOTICE](./NOTICE)
- 内容许可：见 [CONTENT_LICENSE.md](./CONTENT_LICENSE.md)
- 商标与品牌使用：见 [TRADEMARK_POLICY.md](./TRADEMARK_POLICY.md)
