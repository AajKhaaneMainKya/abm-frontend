"use client";

import { useRouter } from "next/navigation";
import { XpWindow } from "@/components/xp";
import NewClientForm from "@/components/apps/new-client-form";

export default function NewClientPage() {
  const router = useRouter();
  return (
    <XpWindow title="New Client Setup" className="mx-auto max-w-2xl">
      <NewClientForm
        onOpenWorkspace={(c) => router.push(`/clients/${c.id}`)}
        onDashboard={() => router.push("/")}
      />
    </XpWindow>
  );
}
