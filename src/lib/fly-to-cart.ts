// Fly-to-cart animation: spawns a floating clone from `origin` that
// animates toward the header cart icon (tagged with data-cart-target).
export function flyToCart(origin: HTMLElement, imageUrl?: string) {
  if (typeof window === "undefined") return;
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;

  const o = origin.getBoundingClientRect();
  const t = target.getBoundingClientRect();

  const clone = document.createElement("div");
  const size = 44;
  clone.style.cssText = `
    position: fixed;
    left: ${o.left + o.width / 2 - size / 2}px;
    top: ${o.top + o.height / 2 - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    border-radius: 9999px;
    background: ${imageUrl ? `center/cover no-repeat url("${imageUrl}")` : "#fff"};
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    z-index: 9999;
    pointer-events: none;
    will-change: transform, opacity;
  `;
  document.body.appendChild(clone);

  const dx = t.left + t.width / 2 - (o.left + o.width / 2);
  const dy = t.top + t.height / 2 - (o.top + o.height / 2);

  const anim = clone.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.9)`, opacity: 0.95, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 },
    ],
    { duration: 700, easing: "cubic-bezier(0.55, 0, 0.55, 1)" },
  );
  anim.onfinish = () => {
    clone.remove();
    target.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.25)" },
        { transform: "scale(1)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  };
}
