"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealOnScrollProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  delay?: number;
};

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  ...props
}: RevealOnScrollProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: reduce ? 14 : 36,
        scale: reduce ? 1 : 0.97,
      }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px", amount: 0.12 }}
      transition={{
        duration: reduce ? 0.35 : 0.68,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
