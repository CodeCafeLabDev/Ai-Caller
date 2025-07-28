import { Suspense } from "react";
import ClientDetailsUsage from "./ClientDetailsUsage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientDetailsUsage />
    </Suspense>
  );
}
