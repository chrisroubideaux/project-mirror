// app/emotes/page.tsx
"use client";

import Nav from "@/components/nav/Nav";
import AuroraPresence from "@/components/avatar/AuroraPresence";

export default function Emotes() {
  return (
    <>
     <Nav />
  
      <main
        style={{
          display: "flex",
          flexDirection: "column",
         // alignItems: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <div >
          <AuroraPresence />
        </div>
      </main>
    </>
  );
}