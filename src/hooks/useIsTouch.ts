import { useEffect, useState } from "react";

/** true em dispositivos sem mouse (celular/tablet). Só resolve após hidratar. */
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isTouch;
}
