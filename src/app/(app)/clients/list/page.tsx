import { Suspense } from "react";
import ClientsList from "./ClientsList";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientsList />
    </Suspense>
  );
}

