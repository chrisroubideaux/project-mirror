// app/about/page.tsx
import Nav from "@/components/nav/Nav";

import AboutHero from "@/components/about/AboutHero";
import AuroraPhilosophy from "@/components/about/AuroraPhilosophy";
import MissionSection from "@/components/about/MissionSection";
import TechnologyStack from "@/components/about/TechnologyStack";
//import HologramAvatar from "@/components/about/HologramAvatar";
import NeonSeparator from "@/components/about/NeonSeparator";
import SectionWrapper from "@/components/about/SectionWrapper";

export default function AboutPage() {
  return (
    <main>
      <Nav /> 
     <AboutHero />
      <NeonSeparator />
    
    

      <SectionWrapper>
        <AuroraPhilosophy />
      </SectionWrapper>

      <NeonSeparator />

      <SectionWrapper>
        <MissionSection />
      </SectionWrapper>

      <NeonSeparator />

      <SectionWrapper>
        <TechnologyStack />
      </SectionWrapper>
    </main>
  );
}
