// StickyCart is intentionally a no-op.
// The global FloatingCartBar (rendered in App.jsx) already handles
// the sticky cart bar for the entire app. This stub exists so that
// Home.jsx can import it without errors while we keep a single
// source of truth for cart UI.
export default function StickyCart() {
    return null;
}
