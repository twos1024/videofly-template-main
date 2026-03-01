/**
 * ============================================
 * Admin API - 添加积分（仅用于测试）
 * ============================================
 *
 * POST /api/v1/admin/credits/add
 *
 * 请求体:
 * {
 *   "userId": "user-id",      // 可选，默认为当前用户
 *   "credits": 100,           // 积分数量
 *   "expiryDays": 365,        // 可选，过期天数（默认365）
 *   "remark": "测试充值"       // 可选，备注
 * }
 *
 * 注意：
 * - 仅用于开发/测试环境
 * - 生产环境应禁用此接口
 * - 需要 ADMIN 权限
 */

import { requireAdmin } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { creditService } from "@/services/credit";
import { CreditTransType } from "@/db/schema";
import { z } from "zod";

const addCreditsSchema = z.object({
  userId: z.string().min(1).optional(),
  credits: z.number().int().positive(),
  expiryDays: z.number().int().positive().optional().default(365),
  remark: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const data = addCreditsSchema.parse(body);

    // 使用当前用户或指定的用户
    const targetUserId = data.userId || admin.id;

    // 添加积分
    const result = await creditService.recharge({
      userId: targetUserId,
      credits: data.credits,
      orderNo: `ADMIN_${Date.now()}`,
      transType: CreditTransType.SYSTEM_ADJUST,
      expiryDays: data.expiryDays,
      remark: data.remark || `Admin added ${data.credits} credits`,
    });

    return apiSuccess({
      packageId: result.packageId,
      userId: targetUserId,
      credits: data.credits,
      message: `Successfully added ${data.credits} credits to user ${targetUserId}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
