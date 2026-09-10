"use client";

import { use } from "react";
import { ThreadView } from "@/components/messaging/ThreadView";

type Params = { convId: string };

export default function CreatorThreadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { convId } = use(params);
  return <ThreadView convId={convId} backPath="/dashboard/messages" />;
}
