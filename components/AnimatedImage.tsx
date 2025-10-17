"use client";

import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";

interface AnimatedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export function AnimatedImage({ src, alt, className = "", style, delay = 0 }: AnimatedImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px"
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    />
  );
}
