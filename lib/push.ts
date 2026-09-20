import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

function vapidReady(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@khota.app",
      pub,
      priv
    );
    return true;
  } catch {
    return false;
  }
}

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
}

/** Best-effort device push. Never throws (must not break the triggering action). */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  try {
    if (!vapidReady()) return;
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;
    const svc = createServiceClient();
    const { data: subs } = await svc
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .in("user_id", unique)
      .limit(500);
    if (!subs || subs.length === 0) return;
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body ?? "",
      link: payload.link ?? "/",
    });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await svc.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      })
    );
  } catch {
    /* push is best-effort */
  }
}
