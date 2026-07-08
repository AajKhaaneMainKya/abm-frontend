"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import DashboardApp from "@/components/apps/dashboard-app";

export default function Home() {
  const router = useRouter();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  useEffect(() => {
    if (!me) return;
    if (me.user_role === "candidate") {
      router.replace("/job-search");
    } else if (me.user_role === "hiring_manager") {
      router.replace("/hiring/briefs");
    }
    // abm role (and role not yet set) stays on this page
  }, [me, router]);

  // Only render the ABM dashboard once we know the role is 'abm' — for
  // candidate/hiring_manager this stays blank while the redirect above fires,
  // and for a not-yet-set role it stays blank too, behind Shell's RoleSelector.
  if (me && me.user_role !== "abm") return null;

  return <DashboardApp />;
}
