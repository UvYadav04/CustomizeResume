// Computes where a tall, single-page resume DOM should be sliced into
// separate PDF pages WITHOUT ever cutting through a line of text or a
// section-divider rule.
//
// Why this exists: html2pdf.js's built-in multi-page support (the
// `pagebreak` option) rasterizes the whole element to one canvas and then
// slices that image at fixed pixel intervals (its "legacy" mode) unless its
// "css" mode finds explicit page-break markup - which our templates don't
// have. Fixed-interval slicing has no idea where a text line or a
// section-title's border-bottom actually sits, so a slice boundary landing
// mid-line visually "cuts a line in half", and the two halves end up on
// different PDF pages - exactly the "horizontal line messing into the text
// above/below it" symptom that kept coming back. Measuring real content
// gaps ourselves and only cutting there removes that failure mode entirely.
export interface PageSlice {
  top: number; // px, relative to the captured element's own top
  bottom: number; // px, relative to the captured element's own top
}

// Selectors for every element that represents one visual "line" or unit
// that must never be split across two pages. Deliberately broad/redundant
// (e.g. both .rt-entry and its bullets) - overlapping ranges just get
// merged below, so there's no harm in over-including.
const ATOMIC_SELECTOR = [
  ".rt-header",
  ".rt-section-title",
  ".rt-summary",
  ".rt-skill-row",
  ".rt-tech-line",
  ".rt-entry",
  ".rt-entry-bullets li",
  ".rt-project-about",
  ".rt-edu-degree",
  ".rt-coursework"
].join(", ");

function getMergedAtomicRanges(root: HTMLElement): Array<[number, number]> {
  const rootTop = root.getBoundingClientRect().top;
  const ranges: Array<[number, number]> = [];

  root.querySelectorAll<HTMLElement>(ATOMIC_SELECTOR).forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    ranges.push([rect.top - rootTop, rect.bottom - rootTop]);
  });

  ranges.sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

// Splits `root`'s full height into PDF-page-sized slices, nudging each
// candidate cut point UP (never down, so nothing gets pushed past where it
// naturally fit) to the nearest gap between atomic ranges, if the ideal cut
// lands inside one of them.
export function computePageSlices(root: HTMLElement, pageHeightPx: number): PageSlice[] {
  const totalHeight = root.scrollHeight;
  const ranges = getMergedAtomicRanges(root);
  const slices: PageSlice[] = [];

  let currentTop = 0;
  const epsilon = 0.5;

  while (currentTop < totalHeight - epsilon) {
    const idealBottom = currentTop + pageHeightPx;

    if (idealBottom >= totalHeight) {
      slices.push({ top: currentTop, bottom: totalHeight });
      break;
    }

    let cut = idealBottom;
    for (const [start, end] of ranges) {
      if (idealBottom > start && idealBottom < end) {
        cut = start;
        break;
      }
    }

    // Guard against a single atomic element being taller than a whole page
    // (shouldn't happen in practice for resume content) - rather than loop
    // forever, accept the mid-element cut this one time.
    if (cut <= currentTop) {
      cut = idealBottom;
    }

    slices.push({ top: currentTop, bottom: cut });
    currentTop = cut;
  }

  return slices;
}
