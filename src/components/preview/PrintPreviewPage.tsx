import { useEffect, useState } from "react";
import { trimSkillRowsToOneLine } from "@/lib/skillLineFit";

// Keys the opener tab (Header.tsx) writes to sessionStorage right
// before calling window.open() on this same app with ?printPreview=1.
// window.open() from the same origin clones the opener's sessionStorage
// into the new tab at open time, so as long as these are written BEFORE
// window.open() is called, they're already present when this page mounts -
// no postMessage/BroadcastChannel round-trip needed.
export const PRINT_PREVIEW_KEYS = {
  html: "rt-print-html",
  css: "rt-print-css",
  title: "rt-print-title",
  fontsUrl: "rt-print-fonts-url"
};

// A real, same-origin, navigable page (not a blob: URL) that the browser's
// print pipeline renders and prints directly - this is deliberately built
// to mirror how the original Chrome extension's preview/print page worked
// (a real chrome-extension:// page with a print button calling
// window.print()), which produced a proper, real-text PDF. Printing a
// blob: URL opened via window.open(), as an earlier version of this
// feature did, triggered some browsers/print pipelines to fall back to
// rasterizing the page into an image instead of real text - switching to
// an actual same-origin route (this component, reached via
// "?printPreview=1") avoids that failure mode entirely.
export function PrintPreviewPage() {
  const [data] = useState(() => {
    const css = sessionStorage.getItem(PRINT_PREVIEW_KEYS.css) || "";
    const fontsUrl = sessionStorage.getItem(PRINT_PREVIEW_KEYS.fontsUrl) || "";
    return {
      html: sessionStorage.getItem(PRINT_PREVIEW_KEYS.html) || "",
      // Same approach as the original extension's template CSS: the font
      // import lives directly inside the stylesheet text itself (a plain
      // `@import url(...)` at the top), not a separate <link> element
      // managed in JS - one CSS blob, nothing else to load or clean up.
      css: fontsUrl ? `@import url("${fontsUrl}");\n${css}` : css,
      title: sessionStorage.getItem(PRINT_PREVIEW_KEYS.title) || "Resume"
    };
  });

  useEffect(() => {
    document.title = data.title;

    (async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // ignore - fall through and trim with whatever's rendered
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
      trimSkillRowsToOneLine(document);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data.html) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        No resume data found for this print view. Go back to the app and click "Print / Save as PDF" again.
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: data.css }} />
      <style>{`
        @media print {
          html, body { background: #fff !important; margin:0 !important;padding:0 !important }
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </>
  );
}
