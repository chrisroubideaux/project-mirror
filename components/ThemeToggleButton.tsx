// components/ThemeToggleButton.tsx
'use client';

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme, setTheme } from "@/store/features/themeSlice";

type Props = {
  placement?: "inline" | "fixed"; // default inline
  className?: string;             // optional extra classes
};

export default function ThemeToggleButton({ placement = "inline", className = "" }: Props) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) dispatch(setTheme(savedTheme));
  }, [dispatch]);

  // Apply + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);
  }, [mode]);

  const baseClasses =
    "btn btn-outline-secondary rounded-pill px-3 py-1 shadow-sm";
  const fixedClasses =
    "position-fixed top-0 end-0 m-3"; // only when placement === 'fixed'

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={`${baseClasses} ${placement === "fixed" ? fixedClasses : ""} ${className}`}
      onClick={() => dispatch(toggleTheme())}
    >
      {mode === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

