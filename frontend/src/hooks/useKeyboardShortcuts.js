import { useEffect } from "react";

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * handlers: { [key]: fn }  e.g. { n: openNote, t: openTask }
 * Keys are matched case-insensitively.
 */
export function useKeyboardShortcuts(handlers, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        function onKeyDown(e) {
            // Skip if a text input is focused
            if (
                INPUT_TAGS.has(e.target.tagName) ||
                e.target.isContentEditable
            ) return;

            // Skip modifier combos
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const fn = handlers[e.key.toLowerCase()];
            if (fn) {
                e.preventDefault();
                fn();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [handlers, enabled]);
}
