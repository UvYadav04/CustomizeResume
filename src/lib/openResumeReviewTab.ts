import { PRINT_PREVIEW_KEYS } from "@/components/preview/PrintPreviewPage";
import { GOOGLE_FONTS_URL } from "@/lib/templates";

// Shared by the "Review resume" header button and (previously) the
// standalone in-app review screen: opens a REAL same-origin route
// ("?printPreview=1") in a new tab and hands it the rendered resume
// HTML/CSS via sessionStorage (window.open() clones the opener's
// sessionStorage into a same-origin popup, so no network round-trip is
// needed). This is deliberately not a blob: URL - printing a blob: URL
// page turned out to make some browsers rasterize the whole page into an
// image instead of keeping real text (see PrintPreviewPage.tsx for the
// full story). That page renders the resume at real size with real
// margins/padding and has its own "Print / Save as PDF" button.
export function openResumeReviewTab({
  html,
  css,
  filenameBase
}: {
  html: string;
  css: string;
  filenameBase: string;
}): boolean {
  sessionStorage.setItem(PRINT_PREVIEW_KEYS.html, html);
  sessionStorage.setItem(PRINT_PREVIEW_KEYS.css, css);
  sessionStorage.setItem(PRINT_PREVIEW_KEYS.title, filenameBase);
  sessionStorage.setItem(PRINT_PREVIEW_KEYS.fontsUrl, GOOGLE_FONTS_URL);

  const printUrl = `${window.location.origin}${window.location.pathname}?printPreview=1`;
  const win = window.open(printUrl, "_blank");
  return !!win;
}
