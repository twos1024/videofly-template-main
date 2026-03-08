# Creem 接入说明（已归档）

当前 `PexelMuse MVP` 默认支付路径是 `Stripe`，这份文档不再是当前生产部署手册。

保留这份文件的原因只有一个：如果你未来决定重新启用 `Creem`，这里可以作为迁移检查清单，而不是直接照着执行的上线指南。

## 当前状态

- 默认账单提供商：`Stripe`
- 当前 `.env.example`：以 `Stripe` 为准
- 当前 README / docs：以 `Stripe` 为准

## 如果你要重新启用 Creem

至少需要重新审查这些位置：

- `src/config/billing-provider.ts`
- `src/lib/auth/auth.ts`
- `src/lib/auth/client.ts`
- `src/lib/auth/env.mjs`
- `src/config/pricing-user.ts`
- `src/config/credits.ts`
- `src/components/price/*`
- `src/app/api/auth/[...all]/route.ts`

以及以下文档是否同步：

- `.env.example`
- `README.md`
- `docs/README.md`
- `docs/CONFIGURATION_GUIDE.md`
- `docs/API-INTEGRATION-GUIDE.md`

## 启用前必须确认

- 当前价格组件是否真的走 `Creem`
- Webhook 路径和 Better Auth 插件是否仍然兼容
- 前端是否还在显示 `Stripe-only` 的文案
- 价格 ID / Product ID / 权益同步是否仍然正确

如果没有完成这轮代码和文档审计，不建议直接恢复 `Creem`。
