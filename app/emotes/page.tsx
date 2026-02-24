// app/emotes/page.tsx
// app/emotes/page.tsx
"use client";

import { useState } from "react";
import Nav from "@/components/nav/Nav";
import AuroraIntroPresence from "@/components/avatar/intro/AuroraIntroPresence";

export default function Emotes() {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <>
      <Nav />

      <main
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "black",
          overflow: "hidden",
        }}
      >
        {/* Trigger Button (only shown before intro starts) */}
        {!showIntro && (
          <div
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setShowIntro(true)}
              style={{
                padding: "14px 28px",
                fontSize: "1.1rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.4)",
                color: "white",
                backdropFilter: "blur(10px)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              ✨ Meet Aurora
            </button>
          </div>
        )}

        {/* Intro Presence (auto plays on mount) */}
        {showIntro && <AuroraIntroPresence />}
      </main>
    </>
  );
}


{/*
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
        < AuroraPresence />
         
        </div>
      </main>
    </>
  );
}
*/}