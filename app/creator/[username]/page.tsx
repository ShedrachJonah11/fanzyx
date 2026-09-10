"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { CreatorProfileSkeleton } from "./CreatorProfile";
import { useAuth } from "@/services/context";
import { users } from "@/services/modules/users";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import type { PostOut, UserPublic } from "@/services/dtos";
import type { Creator } from "@/lib/mock-data";
import { CreatorProfile } from "./CreatorProfile";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const COVER_GRADIENT =
  "linear-gradient(135deg, #4C1D95 0%, #831843 60%, #0F172A 100%)";

export default function CreatorProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useAuth();
  const shellVariant = user?.role === "creator" ? "creator" : "fan";

  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setStatus("loading");
      try {
        const [me, page] = await Promise.all([
          users.byUsername(username),
          postsApi.byCreator(username, { limit: 24 }).catch(() => ({
            items: [] as PostOut[],
            nextCursor: null,
          })),
        ]);
        if (cancelled) return;
        setProfile(me);
        setPosts(page.items);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setStatus("not-found");
          return;
        }
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load profile");
        setStatus("not-found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  const creator = useMemo<Creator | null>(
    () => (profile ? toMockCreator(profile) : null),
    [profile]
  );

  if (status === "not-found") return notFound();

  if (status === "loading" || !creator) {
    return (
      <DashboardShell variant={shellVariant}>
        <CreatorProfileSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell variant={shellVariant}>
      <CreatorProfile creator={creator} posts={posts} />
    </DashboardShell>
  );
}

/* ── Adapter (only for the profile header — CreatorProfile still consumes
 *    the mock Creator shape for the cover/avatar/subscribers block). ─── */

function toMockCreator(u: UserPublic): Creator {
  return {
    id: u.id,
    name: u.displayName || u.username,
    username: u.username,
    bio: u.bio ?? "",
    avatarGradient: BRAND_GRADIENT,
    coverGradient: COVER_GRADIENT,
    image: u.avatarUrl ?? undefined,
    coverImage: u.coverUrl ?? undefined,
    verified: u.verified,
    subscribers: u.subscriberCount ?? 0,
    followers: u.followerCount ?? 0,
    monthlyPrice: 0,
    socials: u.socials
      ? {
          instagram: u.socials.instagram,
          twitter: u.socials.x,
          tiktok: u.socials.tiktok,
        }
      : undefined,
  };
}
