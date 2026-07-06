import { redirect } from "next/navigation";

/**
 * The hiring-manager nav (components/shell.tsx HIRING_NAV) now points
 * straight at /hiring/briefs and /hiring/post — this route just catches
 * anyone who still has /hiring bookmarked.
 */
export default function HiringDashboardPage() {
  redirect("/hiring/briefs");
}
