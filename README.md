# VideoFly 🎬

一个面向快速上线的 AI 视频生成 SaaS 模板，基于 Next.js 15 构建，支持 Sora 2、Veo 3.1、Wan 2.6 等模型。

> 当前仓库默认收敛为 `Stripe-only + video-only + polling-only` 的 MVP 路线，便于直接部署到 Vercel。

## ✨ 核心特性

### 🎬 AI 视频生成

- **多模型支持** - Sora 2、Wan 2.6、Veo 3.1、Seedance 1.5 Pro
- **统一工作流** - 首页轻量输入框 + `/create/video` 工作台
- **智能积分系统** - FIFO 积分消耗，支持冻结/结算/释放
- **稳定状态追踪** - 默认 15s 轮询，适合 Vercel MVP 部署

### 🎨 现代化 UI

- **Tailwind CSS 4 + shadcn/ui** - 精美可定制界面
- **深色主题** - 专为视频创作场景优化
- **流畅动画** - Framer Motion 动画效果
- **响应式设计** - 完美支持移动端

### 🏢 企业级架构

- **Next.js 15** - 最新 App Router 架构
- **React 19** - 最新 React 特性
- **Drizzle ORM** - 类型安全的数据库操作
- **Better Auth** - Google OAuth + Magic Link
- **Stripe** - 默认支付方案，简化 MVP 部署

### 🌍 国际化

- **多语言支持** - 英语、中文无缝切换
- **SEO 优化** - 元数据自动生成
- **本地化路由** - `/en/`、`/zh/` 前缀

## 🚀 快速开始

### 环境要求

- Node.js 20
- pnpm 9+
- PostgreSQL 数据库

### 安装

```bash
# 克隆仓库（使用模板仓库）
git clone https://github.com/zifeixu85/videofly-template.git your-project
cd your-project

# 可选：如果你使用 nvm/fnm，会切到仓库指定的 Node 20
nvm use

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 本地开发编辑 .env.local
# Vercel 也使用同一套 key，直接参考 .env.example

# 初始化数据库
pnpm db:push

# 启动开发服务器
pnpm dev

# 部署前检查
pnpm typecheck
pnpm build
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zifeixu85/videofly-template)

## 📁 项目结构

```
videofly/
├── src/
│   ├── app/                       # App Router 页面与 API
│   │   ├── [locale]/              # 国际化页面分组
│   │   │   ├── (marketing)/       # 营销页
│   │   │   ├── (tool)/            # 视频生成工作台
│   │   │   ├── (dashboard)/       # 用户后台
│   │   │   └── (admin)/           # 管理后台
│   │   └── api/                   # Auth / billing / video API
│   ├── components/
│   │   ├── landing/               # 首页与营销页组件
│   │   ├── tool/                  # 工作台壳层与历史流
│   │   ├── video-generator/       # 通用视频生成器组件体系
│   │   ├── creation/              # 我的作品页组件
│   │   ├── price/                 # 定价与支付 UI
│   │   └── ui/                    # 基础 UI 组件
│   ├── config/                    # 站点、模型、导航、功能开关
│   │   ├── tool-pages/            # 工具页配置与 adapter
│   │   └── price/                 # Stripe 定价映射
│   ├── services/                  # 业务服务层（video / credit / billing）
│   ├── lib/                       # 基础设施与通用工具
│   │   ├── auth/                  # Better Auth 配置
│   │   ├── api/                   # API 响应与客户端
│   │   └── storage.ts             # R2/S3 存储封装
│   ├── ai/                        # AI provider 适配层
│   ├── db/                        # Drizzle schema 与 DB 入口
│   ├── hooks/                     # React hooks
│   ├── stores/                    # 客户端状态
│   ├── messages/                  # i18n 文案
│   └── styles/                    # 全局样式与主题
├── scripts/                  # 工具脚本
├── docs/                     # 文档
└── public/                   # 静态资源
```

### 当前目录约定

- `components/video-generator/` 只放可复用生成器能力，不混接口请求和页面状态
- `components/tool/` 只保留工作台装配、历史流和落地页壳层
- `config/tool-pages/` 是模型、比例、时长、上传模式的唯一配置入口
- `services/` 承接视频、积分、计费等服务端业务流程
- `lib/` 只放跨域工具与基础设施，不再堆放旧页面级实现

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 运行时 | React 19 |
| 语言 | TypeScript |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | Better Auth + Google OAuth + Magic Link |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 支付 | Stripe |
| 存储 | R2/S3 |
| 动画 | Framer Motion |

## 📝 环境变量

```bash
# 数据库
DATABASE_URL='postgresql://user:pass@host:5432/db'

# 认证
BETTER_AUTH_SECRET='your-secret'
NEXT_PUBLIC_APP_URL='http://localhost:3000'
GOOGLE_CLIENT_ID='your-google-client-id'
GOOGLE_CLIENT_SECRET='your-google-client-secret'

# 存储 (R2/S3)
STORAGE_ENDPOINT='https://your-r2-endpoint'
STORAGE_ACCESS_KEY='your-access-key'
STORAGE_SECRET_KEY='your-secret-key'
STORAGE_BUCKET='your-bucket'
STORAGE_DOMAIN='https://your-domain.com'

# AI 提供商
EVOLINK_API_KEY='your-evolink-key'
AI_CALLBACK_URL='https://your-domain.com/api/v1/video/callback'
CALLBACK_HMAC_SECRET='your-callback-secret'
VIDEO_RECOVERY_SECRET='your-recovery-secret'
REMOTE_ASSET_ALLOWED_HOSTS='assets.example.com,*.cloudfront.net'

# 计费提供商
NEXT_PUBLIC_BILLING_PROVIDER='stripe'

# 支付 - Stripe（当 NEXT_PUBLIC_BILLING_PROVIDER=stripe 时必填）
STRIPE_API_KEY='your-stripe-key'
STRIPE_WEBHOOK_SECRET='your-stripe-webhook-secret'

# 邮件
RESEND_API_KEY='your-resend-api-key'
RESEND_FROM='noreply@yourdomain.com'
```

`VIDEO_RECOVERY_SECRET` 只用于内部恢复接口，未配置时 `/api/v1/video/recover` 会默认关闭，并且必须通过 `Authorization: Bearer ...` 调用。
`REMOTE_ASSET_ALLOWED_HOSTS` 用于限制服务端可下载的 provider/CDN 结果域名，避免回调恢复和任务完成流程被恶意 URL 利用。
当前 MVP 默认关闭实时 SSE，前端统一使用轮询获取结果，更适合 Vercel 的部署模型。

## 🔄 同步模板更新

如果你基于本模板创建了自己的项目，可以按照以下方式同步模板的最新更新：

### 方式一：添加上游仓库（推荐）

```bash
# 添加上游仓库
git remote add upstream https://github.com/zifeixu85/videofly-template.git

# 获取上游更新
git fetch upstream

# 合并上游 main 分支
git merge upstream/main --allow-unrelated-histories

# 解决冲突后，推送到你自己的仓库
git push origin main
```

### 方式二：手动比较更新

```bash
# 添加上游仓库
git remote add upstream https://github.com/zifeixu85/videofly-template.git

# 查看上游变更
git diff upstream/main...main

# 选择性合并（查看变更后手动复制）
git checkout upstream/main -- src/components/landing
```

### 同步注意事项

1. **备份数据** - 同步前备份你的 `.env.local` 和数据库
2. **处理冲突** - 如果有冲突，需要手动解决
3. **环境变量** - 模板更新可能新增环境变量，检查 `.env.example`
4. **数据库迁移**
   - 新库初始化：可以直接执行 `pnpm db:migrate`
   - 已有线上数据库：优先执行 `pnpm db:push`，不要直接把首个 baseline migration 重放到已有库上

## 🧩 当前 MVP 收敛项

- **支付收敛**：默认以 Stripe 为唯一支付路径
- **产品收敛**：主流程聚焦视频生成，首页与工作台参数联动
- **部署收敛**：默认轮询，不依赖 SSE 长连接
- **安全收敛**：回调 HMAC、远程素材白名单、存储配置占位值校验

## 🗺 路线图

- [x] 多 AI 模型支持
- [x] 积分系统
- [x] 支付集成 (Creem + Stripe)
- [x] 用户认证
- [x] 视频历史记录
- [x] 多语言国际化
- [ ] 团队协作功能
- [ ] API 访问
- [ ] Webhooks 导出

## 📄 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

本项目基于以下优秀开源项目：

- [shadcn/ui](https://github.com/shadcn-ui/ui) - 精美的 UI 组件库
- [Magic UI](https://magicui.design/) - 现代化动画组件
- [Drizzle ORM](https://orm.drizzle.team/) - 轻量级数据库 ORM
- [Better Auth](https://github.com/next-auth/next-auth) - 现代化认证方案
