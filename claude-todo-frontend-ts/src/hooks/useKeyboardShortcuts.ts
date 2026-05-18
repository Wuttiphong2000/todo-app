import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Options {
  onOpenShortcuts: () => void;
}

export function useKeyboardShortcuts({ onOpenShortcuts }: Options) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // ? — show shortcuts cheat sheet
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      // N — new task
      if (
        (e.key === "n" || e.key === "N") &&
        !isTyping &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        navigate("/add");
        return;
      }

      // / — focus search input on homepage
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>("[data-search-input]");
        input?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onOpenShortcuts]);
}
