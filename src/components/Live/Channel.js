// The legacy Channel row component has been inlined into Channels.tsx
// (Phase 6 rebuild). Nothing in the new tree imports this file, but a
// handful of .js_OLD / .BK files still do — keep a tiny stub so the
// module graph stays clean without resurrecting the legacy UI.
export default function Channel() {
  return null;
}
