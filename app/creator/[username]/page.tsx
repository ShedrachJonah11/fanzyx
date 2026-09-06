import { notFound } from "next/navigation";
import { creators, getCreator, getPostsFor } from "@/lib/mock-data";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { CreatorProfile } from "./CreatorProfile";

export function generateStaticParams() {
  return creators.map((c) => ({ username: c.username }));
}

export default async function CreatorProfilePage({
  params,
}: PageProps<"/creator/[username]">) {
  const { username } = await params;
  const creator = getCreator(username);
  if (!creator) return notFound();
  const posts = getPostsFor(creator.username).filter((p) => p.status === "published");

  return (
    <DashboardShell variant="fan">
      <CreatorProfile creator={creator} posts={posts} />
    </DashboardShell>
  );
}
