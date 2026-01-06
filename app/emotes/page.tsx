// app/emotes/page.tsx
"use client";

import Nav from "@/components/nav/Nav";
import AuroraPresence from "@/components/avatar/AuroraPresence";

export default function Emotes() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Nav />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1rem",
        }}
      >
        {/* Aurora is the focal point */}
        <div >
          <AuroraPresence />
        </div>
      </main>
    </div>
  );
}
