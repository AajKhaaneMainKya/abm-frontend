"use client";

import { useRouter } from "next/navigation";
import NewClientForm from "@/components/apps/new-client-form";

export default function NewClientPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card-flush">
        <NewClientForm
          onOpenWorkspace={(c) => router.push(`/clients/${c.id}/launching`)}
          onDashboard={() => router.push("/")}
        />
      </div>
    </div>
  );
}
