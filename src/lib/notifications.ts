import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "system" | "user" | "informational";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  sender_label: string;
  read: boolean;
  created_at: string;
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  senderLabel: string = "Sistema"
) {
  const { error } = await supabase.from("notifications" as any).insert({
    user_id: userId,
    type,
    title,
    message,
    sender_label: senderLabel,
  });
  return !error;
}

export async function markAsRead(notificationId: string) {
  await supabase
    .from("notifications" as any)
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllAsRead(userId: string) {
  await supabase
    .from("notifications" as any)
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications" as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}
