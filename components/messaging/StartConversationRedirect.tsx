"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { messages } from "@/services/modules/messages";
import { ApiError } from "@/services/apiClient";
import { useMessagingStore } from "@/services/stores/messaging";

/**
 * Handles `?to=<username>` on the messages list page. Calls the idempotent
 * `POST /conversations` endpoint to fetch-or-create the conversation with
 * that user, then replaces the URL with `/messages/<convId>` (or the
 * creator equivalent) so the thread opens.
 *
 * Rendered as `null` — it's a side-effect only component.
 */
export function StartConversationRedirect({
  basePath,
}: {
  basePath: "/messages" | "/dashboard/messages";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const conversations = useMessagingStore((s) => s.conversations);
  const busyRef = useRef(false);

  useEffect(() => {
    const to = params.get("to");
    if (!to) return;
    if (busyRef.current) return;

    // If the conv is already hydrated in the store, jump straight there.
    const existing = Object.values(conversations).find(
      (c) => c.other.username === to
    );
    if (existing) {
      router.replace(`${basePath}/${existing.id}`);
      return;
    }

    busyRef.current = true;
    (async () => {
      try {
        const conv = await messages.startConversation({ withUsername: to });
        router.replace(`${basePath}/${conv.id}`);
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.code === "self_message") {
            toast.error("You can't message yourself.");
          } else if (e.code === "blocked") {
            toast.error("You can't message this user.");
          } else if (e.code === "user_not_found") {
            toast.error(`No user @${to}.`);
          } else {
            toast.error(e.detail ?? "Couldn't start conversation");
          }
        } else {
          toast.error("Couldn't start conversation");
        }
        // Clear the ?to so we don't retry on every re-render.
        router.replace(basePath);
      } finally {
        busyRef.current = false;
      }
    })();
  }, [basePath, params, router, conversations]);

  return null;
}
