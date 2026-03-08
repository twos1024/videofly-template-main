# PexelMuse 邮件系统说明

> 历史模板文档已收敛为当前实现说明。本文件描述当前仓库中的邮件预览、品牌规则和基础用法。

## 1. 作用范围

当前邮件系统主要覆盖：

- Magic Link 邮件
- 欢迎邮件
- 密码重置邮件
- 本地邮件预览

相关目录：

```text
src/lib/emails/
src/app/emails/
src/messages/
```

## 2. 本地预览

```bash
pnpm run email:dev
```

默认预览地址：

```text
http://localhost:3001/emails
```

## 3. 品牌规则

邮件中的品牌元素统一使用：

- App Name: `PexelMuse`
- App URL: `process.env.NEXT_PUBLIC_APP_URL`
- 发件地址：`RESEND_FROM`

不要再在模板或文档中使用旧品牌和旧域名，例如：

- 旧模板品牌名
- 旧生产域名
- 旧品牌文案

## 4. 必需环境变量

```bash
RESEND_API_KEY=re_xxx
RESEND_FROM=noreply@your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 5. 翻译建议

建议使用这些文案方向：

```json
{
  "Emails": {
    "welcome": {
      "title": "Welcome to PexelMuse!"
    },
    "resetPassword": {
      "title": "Reset your password"
    }
  }
}
```

## 6. 组件使用示例

```tsx
<EmailHeader appName="PexelMuse" />
<EmailButton href={process.env.NEXT_PUBLIC_APP_URL}>Open PexelMuse</EmailButton>
<EmailFooter appName="PexelMuse" />
```

## 7. 维护要求

- 邮件模板改动后，先跑本地预览
- 文案、按钮链接和页脚品牌必须保持一致
- 如果修改域名或品牌，优先更新这里和 `src/lib/emails/*`
