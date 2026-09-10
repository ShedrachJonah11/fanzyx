import { redirect } from "next/navigation";

type SearchParams = Promise<{ ref?: string | string[] }>;

/**
 * Referral landing page. Sole purpose is to normalize the incoming
 * `?ref=CODE` and hand off to /signup, which pre-fills the referral field.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  const code = (raw ?? "").trim();
  const target = code
    ? `/signup?ref=${encodeURIComponent(code)}`
    : "/signup";
  redirect(target);
}
