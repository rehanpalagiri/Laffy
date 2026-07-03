import { useEffect, useState } from "react";

export function CustomCursor() {
  const [point, setPoint] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (min-width: 900px)");
    if (!finePointer.matches) return;

    document.body.classList.add("laffy-cursor-enabled");
    const move = (event: MouseEvent) => setPoint({ x: event.clientX, y: event.clientY });
    const over = (event: MouseEvent) => {
      const target = event.target as Element | null;
      setActive(Boolean(target?.closest("a, button, label, input, textarea, [data-cursor='soft']")));
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", over);
    return () => {
      document.body.classList.remove("laffy-cursor-enabled");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", over);
    };
  }, []);

  return (
    <div
      className={`laffy-cursor ${active ? "laffy-cursor-active" : ""}`}
      style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)` }}
      aria-hidden
    />
  );
}
