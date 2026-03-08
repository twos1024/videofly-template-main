# PexelMuse API 集成指南

这份文档描述当前代码库仍在使用的外部集成链路，不再覆盖旧模板里的全部能力。当前主链路是：

- `Evolink` 视频生成
- `Stripe` 计费
- `R2/S3 compatible` 媒体存储
- `callback + polling` 混合同步

## 1. 视频生成链路

### 请求入口

前端统一调用：

- `POST /api/v1/video/generate`

核心字段：

```json
{
  "prompt": "A cinematic aerial shot of a neon city at night",
  "model": "sora-2",
  "mode": "text-to-video",
  "duration": 10,
  "aspectRatio": "16:9",
  "quality": "standard",
  "outputNumber": 1,
  "generateAudio": false,
  "imageUrls": []
}
```

说明：

- UI 中的 `resolution` 会在提交前映射为 provider 所需的 `quality`
- `outputNumber` 和 `generateAudio` 会直接透传到服务端
- 图片上传会先走 `/api/v1/upload`，再把公开 URL 交给生成接口

### 服务端处理

服务端主流程：

1. 校验用户、积分和模型参数
2. 预冻结积分
3. 调用 AI provider 创建任务
4. 保存任务和视频记录
5. 等待 provider callback 或前端轮询刷新状态
6. 下载 provider 产物并上传到对象存储
7. 写回最终视频 URL 和缩略图 URL

相关代码：

- `src/app/api/v1/video/generate/route.ts`
- `src/services/video.ts`
- `src/lib/media-validation.ts`
- `src/lib/storage.ts`

## 2. Evolink 集成

当前默认 AI provider 是 `Evolink`。

### 必填环境变量

```bash
EVOLINK_API_KEY=replace_with_evolink_api_key
AI_CALLBACK_URL=https://your-domain.com/api/v1/video/callback
CALLBACK_HMAC_SECRET=replace_with_callback_hmac_secret
REMOTE_ASSET_ALLOWED_HOSTS=assets.example.com,*.cloudfront.net
```

### 回调要求

- 服务端回调入口：`/api/v1/video/callback/[provider]`
- 回调签名校验使用 `CALLBACK_HMAC_SECRET`
- 如果 `AI_CALLBACK_URL` 缺失或是不可达地址，系统会退回轮询路径
- 生产环境必须显式配置 `REMOTE_ASSET_ALLOWED_HOSTS`

## 3. 轮询与状态同步

当前默认推荐使用轮询作为结果同步主路径。

使用到的接口：

- `GET /api/v1/video/[uuid]/status`
- `GET /api/v1/video/list`
- `GET /api/v1/video/task/[taskId]/status`

说明：

- 即使 provider callback 暂时不可用，只要轮询和 provider 查询可用，任务仍可恢复和收敛
- 前端历史记录使用本地缓存 + 服务端同步的混合策略

## 4. 对象存储

生成完成后，服务端会把 provider 媒体重新上传到你的对象存储，而不是长期直接依赖第三方 URL。

必填环境变量：

```bash
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=replace_with_storage_access_key
STORAGE_SECRET_KEY=replace_with_storage_secret_key
STORAGE_BUCKET=your-bucket
STORAGE_DOMAIN=https://pub-xxxxxxxxxxxxxxxxxxxx.r2.dev
```

上线前需要特别确认：

- `STORAGE_ENDPOINT` 不是模板值
- `STORAGE_BUCKET` 存在且有写权限
- `STORAGE_DOMAIN` 对外可访问

## 5. Stripe 集成

当前默认支付路径是 `Stripe`。

关键接口：

- `POST /api/webhooks/stripe`
- 客户端升级/购买入口由价格组件触发

必填环境变量：

```bash
STRIPE_API_KEY=sk_live_replace_with_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_replace_with_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_replace_with_pro_monthly
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_replace_with_pro_yearly
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_replace_with_business_monthly
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID=price_replace_with_business_yearly
```

## 6. 人工恢复接口

当前恢复接口协议如下：

- `GET /api/v1/video/recover`
- `POST /api/v1/video/recover`
- Header: `Authorization: Bearer $VIDEO_RECOVERY_SECRET`

用途：

- 查询卡住的任务
- 对已在 provider 侧完成、但平台状态未收敛的任务执行人工补偿

脚本：

- `scripts/recover-videos.js`

该脚本现在会：

- 从 `APP_URL` 或 `NEXT_PUBLIC_APP_URL` 推导 API 地址
- 使用 `VIDEO_RECOVERY_SECRET`
- 通过 Bearer token 调用恢复接口

## 7. 历史能力说明

以下内容不再是当前文档的主目标：

- `Creem` 作为默认支付方式
- 使用旧回调 secret 变量名的历史说明
- `?secret=` 形式的恢复接口
- 原模板的全部 `Kie`/多 provider 接入分支

如果你确实要重新启用这些能力，请把旧文档视为迁移参考，并先审查当前代码是否仍然兼容。
