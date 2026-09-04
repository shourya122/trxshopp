#!/usr/bin/env python3
"""
Automated marquee smoothness check.

Loads the site in headless Chromium on a mobile viewport, scrolls the logo
marquee into view, records ~3 s of frame timing + transform samples, and
fails if the animation is paused, stuck, choppy, or snapping back mid-loop.

Usage:
    python3 scripts/check_marquee_smoothness.py [url]
Env:
    MARQUEE_URL   default http://localhost:8080/

Exit code != 0 on regression, so it can be wired into CI later.
"""
import asyncio
import os
import sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else os.environ.get(
    "MARQUEE_URL", "http://localhost:8080/"
)
SAMPLE_MS = 3000
FRAME_BUDGET_MS = 22    # avg below ~45fps = visibly choppy
LONG_FRAME_MS = 50      # single frame >50ms = jank spike
MAX_LONG_FRAMES = 3
MAX_SNAP_JUMPS = 2      # one or two loop wraps in a 3s window is fine


def fail(msg: str) -> None:
    print(f"\u274c marquee-check: {msg}", file=sys.stderr)
    sys.exit(1)


def ok(msg: str) -> None:
    print(f"\u2713 marquee-check: {msg}")


SAMPLE_JS = """
async (sampleMs) => {
  const el = document.querySelector('.animate-marquee');
  if (!el) return { error: 'marquee element not found' };
  const readX = () => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
  const samples = [];
  const deltas = [];
  const start = performance.now();
  let last = start;
  await new Promise((resolve) => {
    function tick(now) {
      deltas.push(now - last);
      last = now;
      samples.push({ t: now - start, x: readX() });
      if (now - start < sampleMs) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
  let jumps = 0;
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    if (dx > 5) jumps++; // marquee moves left; +dx = snap-back / wrap
  }
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const longFrames = deltas.filter((d) => d > 50).length;
  return {
    sampleCount: samples.length,
    startX: samples[0].x,
    endX: samples[samples.length - 1].x,
    avgFrameMs: +avg.toFixed(2),
    longFrames,
    jumps,
    animationName: getComputedStyle(el).animationName,
    animationPlayState: getComputedStyle(el).animationPlayState,
  };
}
"""


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},  # iPhone-ish, the device that suffered
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = await context.new_page()
        try:
            await page.goto(URL, wait_until="domcontentloaded", timeout=30_000)
            track = page.locator(".animate-marquee").first
            await track.wait_for(state="attached", timeout=15_000)
            await track.scroll_into_view_if_needed()
            await page.wait_for_timeout(400)  # let IntersectionObserver flip play-state

            result = await page.evaluate(SAMPLE_JS, SAMPLE_MS)
        finally:
            await browser.close()

    if result.get("error"):
        fail(result["error"])

    print("marquee-check stats:", result)

    if result["animationPlayState"] != "running":
        fail(f"animation not running (state={result['animationPlayState']})")
    if result["startX"] == result["endX"]:
        fail("track did not move during sample window")
    if result["avgFrameMs"] > FRAME_BUDGET_MS:
        fail(f"avg frame {result['avgFrameMs']}ms exceeds budget {FRAME_BUDGET_MS}ms")
    if result["longFrames"] > MAX_LONG_FRAMES:
        fail(
            f"{result['longFrames']} long frames (>{LONG_FRAME_MS}ms) "
            f"exceeds max {MAX_LONG_FRAMES}"
        )
    if result["jumps"] > MAX_SNAP_JUMPS:
        fail(f"{result['jumps']} snap-back jumps — loop not seamless")

    ok(
        f"smooth (avg {result['avgFrameMs']}ms/frame, "
        f"{result['longFrames']} long frames, {result['jumps']} wraps)"
    )


asyncio.run(main())
