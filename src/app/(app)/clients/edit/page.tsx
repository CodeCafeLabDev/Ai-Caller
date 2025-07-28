import { Suspense } from "react";
import EditClientSheet from "./EditClientSheet";

export const dynamic = "force-dynamic";

export default function EditClientPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditClientSheet />
    </Suspense>
  );
} 