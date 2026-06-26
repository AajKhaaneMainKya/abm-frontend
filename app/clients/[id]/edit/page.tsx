"use client";

import { useParams, useRouter } from "next/navigation";
import { XpWindow } from "@/components/xp";
import ClientEditApp from "@/components/apps/client-edit-app";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  return (
    <div className="mx-auto max-w-3xl">
      <XpWindow title="Edit Client">
        <ClientEditApp clientId={id} onDone={() => router.push(`/clients/${id}`)} />
      </XpWindow>
    </div>
  );
}
