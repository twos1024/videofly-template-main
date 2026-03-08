# PexelMuse 配置指南

这份文档只描述当前 `PexelMuse MVP` 的真实配置方式。当前默认部署路径是：

- `Stripe-only`
- `video-first`
- `polling-first`
- `Evolink + R2 + Neon/Postgres`

如果你准备重新启用 `Creem`、图片生成、实时事件流或模板遗留功能，请先审查代码，再补文档，不要直接套用历史说明。

## 1. 环境变量

仓库中的唯一模板文件是 [`.env.example`](../.env.example)。

- 本地开发：复制为 `.env.local`
- Vercel：在 Project Settings -> Environment Variables 中逐项填写

### 必填环境变量

```bash
# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_BILLING_PROVIDER=stripe

# Auth
BETTER_AUTH_SECRET=replace_with_a_random_secret

# Database
DATABASE_URL=postgresql://username:password@db.example.com:5432/pexelmuse?sslmode=require

# Storage
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=replace_with_storage_access_key
STORAGE_SECRET_KEY=replace_with_storage_secret_key
STORAGE_BUCKET=your-bucket
STORAGE_DOMAIN=https://pub-xxxxxxxxxxxxxxxxxxxx.r2.dev

# AI Provider
EVOLINK_API_KEY=replace_with_evolink_api_key
AI_CALLBACK_URL=https://your-domain.com/api/v1/video/callback
CALLBACK_HMAC_SECRET=replace_with_callback_hmac_secret
REMOTE_ASSET_ALLOWED_HOSTS=assets.example.com,*.cloudfront.net

# Billing
STRIPE_API_KEY=sk_live_replace_with_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_replace_with_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_replace_with_pro_monthly
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_replace_with_pro_yearly
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_replace_with_business_monthly
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID=price_replace_with_business_yearly
```

### 推荐但可选

```bash
# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=
RESEND_FROM=noreply@your-domain.com

# Admin bootstrap
ADMIN_EMAIL=you@your-domain.com

# Recovery API
VIDEO_RECOVERY_SECRET=replace_with_recovery_secret

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 2. 关键配置约束

### App URL

- `NEXT_PUBLIC_APP_URL` 可以填写完整 URL，也可以填写裸域名
- 当前代码会自动补协议，但生产环境仍建议显式填写 `https://your-domain.com`

### 数据库

- 推荐使用 `Neon pooled connection`
- `DATABASE_URL` 和 `POSTGRES_URL` 在代码里是别名，二选一即可
- 不要保留模板值 `@host`，否则初始化数据库时会报 DNS 错误

### 对象存储

- 当前生产链路要求 R2/S3 兼容存储可用
- `STORAGE_ENDPOINT`、`STORAGE_BUCKET`、`STORAGE_DOMAIN` 不能留模板占位值
- 服务端会在启动和上传路径上提前校验明显错误的占位配置

### AI 回调与媒体安全

- `CALLBACK_HMAC_SECRET` 只用于 AI provider 回调验签
- 不要再使用旧的回调 secret 变量名
- `REMOTE_ASSET_ALLOWED_HOSTS` 必须包含 provider 返回的视频或缩略图域名
- 本地开发时如果没有公开回调地址，系统会自动退回轮询路径

### 恢复接口

- `/api/v1/video/recover` 使用 `Authorization: Bearer $VIDEO_RECOVERY_SECRET`
- 不再支持 `?secret=` 查询参数
- 只有设置了 `VIDEO_RECOVERY_SECRET` 才应在生产环境启用该接口

## 3. 当前运行模式

当前代码默认使用以下产品边界：

- `NEXT_PUBLIC_BILLING_PROVIDER=stripe`
- `enableImageGeneration=false`
- `enableRealtimeVideoEvents=false`

这意味着：

- 主链路以视频生成为核心
- 实时事件流不是部署前置条件
- 轮询是当前最稳的结果同步方式

## 4. Vercel 部署建议

### 构建前

- 检查 `.env.example` 中的必填项是否都已配置到 Vercel
- 确保 `NEXT_PUBLIC_APP_URL` 与当前绑定域名一致
- 确保 `DATABASE_URL`、`STORAGE_*`、`STRIPE_*`、`EVOLINK_API_KEY` 使用真实值

### 部署后

至少验证以下路径：

- 首页和 `/create/video`
- `/api/v1/video/generate`
- `/api/v1/video/[uuid]/status`
- `/api/webhooks/stripe`
- `/api/v1/video/callback/[provider]`

## 5. 常见问题

### 构建时报 `Invalid environment variables`

优先检查：

- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`

### 视频生成时报 5xx

优先检查：

- `EVOLINK_API_KEY`
- `AI_CALLBACK_URL`
- `CALLBACK_HMAC_SECRET`
- `REMOTE_ASSET_ALLOWED_HOSTS`
- `STORAGE_*`

### 数据库初始化时报 `getaddrinfo EAI_AGAIN host`

这通常意味着你还在使用模板连接串，比如：

```bash
postgresql://user:password@host:5432/database?sslmode=require
```

请替换成真实的 Neon/Postgres URL。

## 6. 不再推荐的历史配置

以下内容不属于当前默认部署路径：

- `Creem` 生产接入
- 查询参数形式的恢复 secret
- 旧模板品牌
- 旧生产域名
- 旧回调 secret 变量名

如果你必须回退到这些历史能力，请把对应文档当作迁移参考，而不是直接执行手册。
