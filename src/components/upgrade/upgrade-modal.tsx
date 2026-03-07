/**
 * Upgrade Modal
 *
 * 升级弹窗组件
 * - 显示定价信息
 * - 支持三种类型：一次性积分包、按月订阅、按年订阅
 * - 根据 openModal 传入的 reason 显示不同的提示信息
 */

"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PricingCards } from "@/components/price/pricing-cards";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

function UpgradeModalContent() {
  const t = useTranslations("UpgradeModal");
  const { isOpen, closeModal, reason, requiredCredits } = useUpgradeModal();
  const [userId, setUserId] = useState<string | undefined>();

  // 获取当前用户
  useEffect(() => {
    authClient.getSession().then((session) => {
      setUserId(session?.data?.user?.id);
    });
  }, []);

  // 根据 reason 显示不同的标题
  const getTitle = () => {
    switch (reason) {
      case "insufficient_credits":
        return t("insufficient_credits_title");
      case "expired":
        return t("expired_title");
      default:
        return t("default_title");
    }
  };

  // 根据 reason 显示不同的描述
  const getDescription = () => {
    switch (reason) {
      case "insufficient_credits":
        return t("insufficient_credits_description", {
          credits: requiredCredits ?? 0,
        });
      case "expired":
        return t("expired_description");
      default:
        return t("default_description");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className="!p-0 overflow-hidden max-h-[90vh]"
        style={{
          width: '100%',
          maxWidth: '880px',
        }}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-background"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* 标题区域 */}
        <div className="px-4 sm:px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl">{getTitle()}</DialogTitle>
          <DialogDescription className="sr-only">{getDescription()}</DialogDescription>
          {getDescription() && (
            <p className="text-sm text-muted-foreground mt-2">{getDescription()}</p>
          )}
        </div>

        {/* 定价内容区域 - 可滚动 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6">
          <PricingCards userId={userId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { UpgradeModalContent as UpgradeModal };
