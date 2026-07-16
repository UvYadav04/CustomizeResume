import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "@/components/layout/Header";
import { JobForm } from "@/components/form/JobForm";
import { ReviewPanel } from "@/components/review/ReviewPanel";
import { PrintPreviewPage } from "@/components/preview/PrintPreviewPage";
import { Loader2 } from "lucide-react";

export default function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  // The "Review resume" header button opens this SAME app in a new tab at
  // ?printPreview=1 instead of a blob: URL - printing a blob: URL page
  // turned out to make some browsers rasterize the page into an image
  // instead of keeping it as real text. A real same-origin route doesn't
  // have that problem (this mirrors how the original Chrome extension's
  // print page worked: a real extension-page URL with a print button).
  // Checked before hydrate()/the store even runs, since this view needs
  // none of that - it only reads what Header.tsx wrote to sessionStorage
  // right before opening this tab.
  const isPrintPreview =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("printPreview") === "1";

  useEffect(() => {
    if (!isPrintPreview) hydrate();
  }, [hydrate, isPrintPreview]);

  if (isPrintPreview) {
    return <PrintPreviewPage />;
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your resume workspace…
      </div>
    );
  }

  // Single, permanent dashboard layout - no in-app "review" screen. The
  // actual rendered resume (real page size/margins) is only ever viewed by
  // opening it in a new tab via the "Review resume" button, never inline.
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <section className="w-[40%] min-w-[340px] shrink-0 border-r bg-card">
          <JobForm />
        </section>
        <section className="flex-1 bg-background">
          <ReviewPanel />
        </section>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
