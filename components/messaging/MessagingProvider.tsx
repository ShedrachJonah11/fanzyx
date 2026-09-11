"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/services/context";
import { wsClient } from "@/services/ws/client";
import { useMessagingStore } from "@/services/stores/messaging";

/**
 * Mounts once at the app root. When a user is authed, opens the WebSocket
 * and pipes server events into the messaging store. Tears down cleanly on
 * sign-out.
 */
export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const setMeId = useMessagingStore((s) => s.setMeId);
  const reset = useMessagingStore((s) => s.reset);
  const applyIncomingMessage = useMessagingStore((s) => s.applyIncomingMessage);
  const applyPresence = useMessagingStore((s) => s.applyPresence);
  const applyTyping = useMessagingStore((s) => s.applyTyping);
  const applyDelivered = useMessagingStore((s) => s.applyDelivered);
  const applyRead = useMessagingStore((s) => s.applyRead);
  const applyUnlocked = useMessagingStore((s) => s.applyUnlocked);

  useEffect(() => {
    if (!user) {
      setMeId(null);
      reset();
      wsClient.disconnect();
      return;
    }
    setMeId(user.id);

    // Wire event handlers first, then connect so we don't miss the first hello.
    const unsubs = [
      wsClient.subscribe("message:new", (e) => {
        applyIncomingMessage(e.conversation_id, e.message);
      }),
      wsClient.subscribe("presence", (e) => {
        applyPresence(e.user_id, {
          online: e.online,
          lastSeenAt: e.online ? null : e.at,
        });
      }),
      wsClient.subscribe("typing", (e) => {
        if (e.user_id === user.id) return; // ignore own echo
        applyTyping(e.conversation_id, e.user_id);
      }),
      wsClient.subscribe("message:delivered", (e) => {
        applyDelivered(e.message_id, e.at);
      }),
      wsClient.subscribe("message:read", (e) => {
        applyRead(e.conversation_id, e.up_to_message_id);
      }),
      wsClient.subscribe("message:unlocked", (e) => {
        applyUnlocked(e.conversation_id, e.message_id, e.unlock_count);
      }),
      wsClient.subscribe("identity:updated", (e) => {
        // Pull the fresh identityStatus + verified badge into MeOut so the
        // sidebar CTA, profile button, and badge all flip immediately.
        refresh?.();
        if (e.status === "verified") {
          toast.success("You're verified! Your hidden posts are now public.");
        } else if (e.status === "rejected") {
          toast.error("Verification needs another look — check your inbox.");
        }
      }),
    ];

    wsClient.connect();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    user,
    refresh,
    setMeId,
    reset,
    applyIncomingMessage,
    applyPresence,
    applyTyping,
    applyDelivered,
    applyRead,
    applyUnlocked,
  ]);

  return <>{children}</>;
}
