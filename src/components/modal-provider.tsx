"use client";

import { SignInModalContent } from "@/components/sign-in-modal";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { useMounted } from "@/hooks/use-mounted";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export const ModalProvider = ({
  dict,
  locale,
  children,
}: {
  dict: Record<string, unknown>;
  locale: string;
  children: React.ReactNode;
}) => {
  const mounted = useMounted();
  const signInModal = useSigninModal();
  const signInDict = dict as Record<string, string>;

  return (
    <>
      {children}
      {mounted && (
        <Dialog open={signInModal.isOpen} onOpenChange={(open) => {
          if (open) {
            signInModal.onOpen();
          } else {
            signInModal.onClose();
          }
        }}>
          <DialogContent className="p-0 gap-0 max-w-md">
            {/* Hidden title for accessibility */}
            <DialogTitle className="sr-only">
              {signInDict.signin_title || "Sign In"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {signInDict.signin_subtitle || "Sign in with Google or Email Magic Link"}
            </DialogDescription>
            <SignInModalContent lang={locale} dict={signInDict} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
