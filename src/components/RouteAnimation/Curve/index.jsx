// Curve.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import "./style.scss";
import { routes } from "../../../utils/constants";

const textVariants = {
  initial: {
    opacity: 0,
    y: 50,
    position: "absolute", // 👈 prevents stacking
    left: "50%",
    top: "40%",
    transform: "translateX(-50%)",
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] },
  },
};

const curve = (initialPath, targetPath) => ({
  initial: { d: initialPath },
  enter: {
    d: targetPath,
    transition: { duration: 0.75, delay: 0.25, ease: [0.76, 0, 0.24, 1] },
  },
  exit: {
    d: initialPath,
    transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  },
});

const translate = {
  initial: { top: "-300px" },
  enter: {
    top: "-100vh",
    transition: { duration: 0.75, delay: 0.25, ease: [0.76, 0, 0.24, 1] },
    transitionEnd: { top: "100vh" },
  },
  exit: {
    top: "-300px",
    transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  },
};

const anim = (variants) => ({
  variants,
  initial: "initial",
  animate: "enter",
  exit: "exit",
});

export default function Curve({ children, backgroundColor }) {
  const location = useLocation();
  const [dimensions, setDimensions] = useState({ width: null, height: null });

  useEffect(() => {
    const resize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className="page curve" style={{ backgroundColor }}>
      <div
        style={{ opacity: dimensions.width == null ? 1 : 0 }}
        className="background"
      />

      {/* ✅ AnimatePresence with wait mode */}
      <AnimatePresence mode="wait">
  {dimensions.width != null && (
    <motion.p
      key={location.pathname}
      className="route"
      {...anim(textVariants)}
      onAnimationComplete={() => {
        // removes text after it exits
        if (document.querySelector(".route")) {
          document.querySelector(".route").style.display = "none";
        }
      }}
    >
      {routes[location.pathname]}
    </motion.p>
  )}
</AnimatePresence>

      {dimensions.width != null && <SVG {...dimensions} />}
      {children}
    </div>
  );
}

const SVG = ({ height, width }) => {
  const initialPath = `
    M0 300 
    Q${width / 2} 0 ${width} 300
    L${width} ${height + 300}
    Q${width / 2} ${height + 600} 0 ${height + 300}
    L0 0
  `;

  const targetPath = `
    M0 300
    Q${width / 2} 0 ${width} 300
    L${width} ${height}
    Q${width / 2} ${height} 0 ${height}
    L0 0
  `;

  return (
    <motion.svg {...anim(translate)}>
      <motion.path {...anim(curve(initialPath, targetPath))} fill="#637AB9" stroke="#637AB9" />
    </motion.svg>
  );
};
