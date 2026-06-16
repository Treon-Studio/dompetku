"use client";

import * as React from "react";
import { type TTheme, useUiStore } from "./ui.store";

export function ThemeSync() {
	const theme = useUiStore((s) => s.theme);
	const setTheme = useUiStore((s) => s.setTheme);

	// Initial load from localStorage
	React.useEffect(() => {
		const stored = localStorage.getItem("theme") as TTheme | null;
		if (stored) {
			setTheme(stored);
		} else {
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			setTheme(prefersDark ? "dark" : "light");
		}
	}, [setTheme]);

	// Apply theme to document
	React.useEffect(() => {
		const root = document.documentElement;
		const resolved =
			theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;

		root.classList.remove("light", "dark");
		root.classList.add(resolved);
		localStorage.setItem("theme", theme);
	}, [theme]);

	// Listen for system preference changes
	React.useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			if (theme === "system") {
				const root = document.documentElement;
				root.classList.remove("light", "dark");
				root.classList.add(mediaQuery.matches ? "dark" : "light");
			}
		};
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, [theme]);

	return null;
}
