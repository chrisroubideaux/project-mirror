// 

'use client';

import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

type ParallaxWrapperProps = {
  children: ReactNode;
  offset?: number;
};

export default function ParallaxWrapper({ children, offset = 40 }: ParallaxWrapperProps) {
  const { scrollYProgress } = useScroll();
  const translateY = useTransform(scrollYProgress, [0, 1], [0, offset * -1]);

  return (
    <motion.div style={{ y: translateY }}>
      {children}
    </motion.div>
  );
}
