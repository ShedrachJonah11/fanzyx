import { AuthGate } from "@/components/auth/AuthGate";

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return <AuthGate>{children}</AuthGate>;
}
