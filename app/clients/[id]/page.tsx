"use client";

import { useParams } from "next/navigation";
import ClientDetailApp from "@/components/apps/client-detail-app";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  return <ClientDetailApp clientId={params.id} />;
}
