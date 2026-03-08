# PexelMuse 文档中心

当前仓库的有效主链路是 `PexelMuse MVP`:

- `Next.js 15` + `Better Auth`
- `Stripe` 计费
- `Neon/Postgres` 数据库
- `R2/S3 compatible` 对象存储
- `Evolink` 视频生成
- `polling-first` 状态同步

这意味着文档也以这条主链路为准。任何旧模板品牌、旧生产域名、旧 secret 名或旧支付流程，都只应被视为历史参考，而不是当前部署说明。

## 当前有效文档

- [配置指南](./CONFIGURATION_GUIDE.md)
  说明当前 `.env.example`、Vercel、Neon、R2、Stripe、回调签名与恢复接口的配置方式。
- [API 集成指南](./API-INTEGRATION-GUIDE.md)
  说明当前视频生成、回调、轮询、对象存储和人工恢复的真实链路。
- [代理设置](./PROXY_SETUP.md)
  仅在服务端访问外部 API 需要走代理时使用。

## 历史参考文档

以下文档保留用于迁移、审计或重新启用旧能力时参考，但不再代表当前默认部署方式：

- [Creem 接入说明（已归档）](./CREEM-SETUP-GUIDE.md)
- [`docs/spec/*`](./spec/)
- [`docs/API_KIE/*`](./API_KIE/)

使用这些文档前，先以当前代码和 `.env.example` 为准确认是否仍然适用。

## 推荐阅读顺序

1. 阅读 [配置指南](./CONFIGURATION_GUIDE.md)
2. 按 [API 集成指南](./API-INTEGRATION-GUIDE.md) 检查视频生成链路
3. 用 [`.env.example`](../.env.example) 填写本地或 Vercel 环境变量
4. 本地验证：
   - `pnpm run typecheck`
   - `pnpm build`
5. 部署后验证：
   - `/api/v1/video/generate`
   - `/api/v1/video/[uuid]/status`
   - `Stripe webhook`
   - `AI callback`
   - 对象存储上传

## 当前上线前检查清单

- [ ] `NEXT_PUBLIC_BILLING_PROVIDER=stripe`
- [ ] `NEXT_PUBLIC_APP_URL` 指向当前域名
- [ ] `DATABASE_URL` 指向真实 Neon/Postgres
- [ ] `STORAGE_*` 已填真实 R2/S3 配置
- [ ] `EVOLINK_API_KEY` 已配置
- [ ] `AI_CALLBACK_URL` 和 `CALLBACK_HMAC_SECRET` 已配置
- [ ] `REMOTE_ASSET_ALLOWED_HOSTS` 已覆盖 provider 实际媒体域名
- [ ] `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_*` 已配置
- [ ] `VIDEO_RECOVERY_SECRET` 已按需配置

## 维护原则

- `.env.example` 是仓库里唯一的环境变量模板
- 文档中的域名示例统一使用 `https://your-domain.com`
- 所有回调签名变量统一使用 `CALLBACK_HMAC_SECRET`
- 当前默认支付方式是 `Stripe`，不是 `Creem`
- 如果重新启用旧模板能力，必须先更新文档再上线
