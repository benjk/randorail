import { useEffect } from "react";
import "../styles/highlight.scss";

export default function HighlightOnHash() {
  useEffect(() => {
    const hash = window.location.hash;
    const [id, query] = hash.split("?");

    if (!query?.includes("show=true")) return;

    const el = document.querySelector(id);
    if (!el) return;

    // Calculer un scale adapté à la taille
    const rect = el.getBoundingClientRect();
    const baseSize = Math.max(rect.width, rect.height);

    // Plus l'élément est gros, moins on scale
    let scaleValue;
    if (baseSize < 100) scaleValue = "1.3"; // Petit élément
    else if (baseSize < 300) scaleValue = "1.15"; // Moyen
    else if (baseSize < 600) scaleValue = "1.08"; // Gros
    else scaleValue = "1.04"; // Très gros

    // Appliquer le scale via CSS custom property
    (el as HTMLElement).style.setProperty("--highlight-scale", scaleValue);
    el.classList.add("highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.classList.remove("highlight"), 3000);

    // Preview
    const previewValue = sessionStorage.getItem(`preview${id}`);
    if (!previewValue) return;

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = previewValue;
    } else if (el instanceof HTMLImageElement) {
      el.src = previewValue;
    } else if (el instanceof HTMLElement) {
      if (getComputedStyle(el).backgroundImage !== "none") {
        el.style.backgroundImage = `url(${previewValue})`;
      } else {
        el.innerText = previewValue;
      }
    }

    sessionStorage.removeItem(`preview${id}`);
  }, []);
  return null;
}
