"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

/* =====================
   🔹 Styled Components
   ===================== */
const StyledWrapper = styled.div`
  .outer {
    width: 100%;
    height: 250px;
    border-radius: 12px;
    padding: 1px;
    background: radial-gradient(circle 230px at 0% 0%, #ffffff, #0c0d0d);
    position: relative;
    overflow: hidden;
    box-shadow: 0 0 8px ${(props) => props.glow}33;
  }

  .dot {
    width: 6px;
    aspect-ratio: 1;
    position: absolute;
    background-color: ${(props) => props.glow};
    box-shadow: 0 0 5px ${(props) => props.glow}55;
    border-radius: 100px;
    z-index: 2;
    right: 10%;
    top: 10%;
    animation: moveDot 6s linear infinite;
  }

  @keyframes moveDot {
    0%, 100% {
      top: 10%;
      right: 10%;
    }
    25% {
      top: 10%;
      right: calc(100% - 35px);
    }
    50% {
      top: calc(100% - 30px);
      right: calc(100% - 35px);
    }
    75% {
      top: calc(100% - 30px);
      right: 10%;
    }
  }

  .card {
    z-index: 1;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border: solid 1px #202222;
    background: radial-gradient(circle 280px at 0% 0%, #1a1b1c, #0c0d0d);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-direction: column;
    color: #fff;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .card:hover {
    transform: scale(1.01);
    box-shadow: 0 0 12px ${(props) => props.glow}66;
  }

  .ray {
    width: 220px;
    height: 45px;
    border-radius: 100px;
    position: absolute;
    background-color: ${(props) => props.glow};
    opacity: 0.25;
    box-shadow: 0 0 8px ${(props) => props.glow}66;
    filter: blur(10px);
    transform-origin: 10%;
    top: 0%;
    left: 0;
    transform: rotate(40deg);
  }

  .text {
    font-weight: bolder;
    font-size: 3rem;
    background: linear-gradient(45deg, ${(props) => props.glow}, #fff);
    background-clip: text;
    color: transparent;
  }

  .line {
    width: 100%;
    height: 1px;
    position: absolute;
    background-color: #2c2c2c;
  }

  .topl {
    top: 10%;
    background: linear-gradient(90deg, ${(props) => props.glow} 30%, #1d1f1f 70%);
  }

  .bottoml {
    bottom: 10%;
  }

  .leftl {
    left: 10%;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, ${(props) => props.glow} 30%, #222424 70%);
  }

  .rightl {
    right: 10%;
    width: 1px;
    height: 100%;
  }
`;

/* =====================
   🔹 Counter Animation
   ===================== */
function Counter({ target, start }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return setCount(0);
    const duration = 2000;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(target * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [start, target]);

  return <span>{count}+</span>;
}

/* =====================
   🔹 Dashboard Component
   ===================== */
export default function Dashboard() {
  const { ref, inView } = useInView({
    triggerOnce: true, // ✅ only animate once
    threshold: 0.2,
    rootMargin: "0px 0px -100px 0px",
  });

  const cyan = "#22d3ee";

  const cards = [
    { title: "Years of Experience", target: 8, glow: cyan, from: { x: -100, y: 0 } },
    { title: "Completed Projects", target: 500, glow: cyan, from: { x: 0, y: -100 } },
    { title: "5⭐ Reviews", target: 100, glow: cyan, from: { x: 0, y: 100 } },
    { title: "Countries Served", target: 5, glow: cyan, from: { x: 100, y: 0 } },
  ];

  return (
    <main className="relative overflow-hidden py-10 px-4">
      <div className="text-white max-w-7xl mx-auto">
        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {cards.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, ...item.from }}
              animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.15 }}
            >
              <StyledWrapper glow={item.glow}>
                <div className="outer">
                  <div className="dot" />
                  <div className="card">
                    <div className="ray" />
                    <div className="text">
                      <Counter target={item.target} start={inView} />
                    </div>
                    <div className="text-sm font-light tracking-wide mt-2 text-gray-300">
                      {item.title}
                    </div>
                    <div className="line topl" />
                    <div className="line leftl" />
                    <div className="line bottoml" />
                    <div className="line rightl" />
                  </div>
                </div>
              </StyledWrapper>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
