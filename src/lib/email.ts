import { Resend } from "resend";

import { env } from "@/lib/auth/env.mjs";

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const resend =
  resendClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM to enable email auth."
        );
      },
    }
  ) as Resend);
