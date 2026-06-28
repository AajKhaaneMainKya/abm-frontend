"use client";

import NewClientForm from "@/components/apps/new-client-form";
import { useWindowManager } from "@/components/window-manager";

export default function NewClientApp() {
  const wm = useWindowManager();
  return (
    <NewClientForm
      onOpenWorkspace={(c) =>
        wm.open("client", {
          props: { clientId: c.id, clientName: c.name },
          title: c.name,
        })
      }
      onDashboard={() => wm.open("dashboard")}
    />
  );
}
