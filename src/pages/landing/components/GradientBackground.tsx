import { motion, useScroll, useTransform } from "motion/react";

export function GradientBackground() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "55%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const op1 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.65, 0.85, 0.45, 0.25]);
  const op2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.45, 0.65, 0.35]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-[#000000]">

      {/* Film-grain texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          animation: "grainShift 8s steps(4) infinite",
        }}
      />

      {/* Blob 1 â€” electric blue, top-center */}
      <motion.div
        className="absolute"
        style={{ y: y1, opacity: op1 }}
        animate={{ x: ["-4%","7%","-2%","5%","-4%"], scale:[1,1.07,0.96,1.04,1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="absolute"
          style={{
            top: "-28vh", left: "-18vw",
            width: "130vw", height: "90vh",
            background: "radial-gradient(ellipse 55% 45% at 52% 38%, rgba(0,55,200,0.65) 0%, transparent 60%)",
            filter: "blur(55px)",
          }}
        />
      </motion.div>

      {/* Blob 2 â€” deep violet, mid-left */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y2, opacity: op2 }}
        animate={{ x: ["0%","-7%","5%","-3%","0%"], scale:[1,0.93,1.08,0.97,1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      >
        <div
          className="absolute"
          style={{
            top: "18%", left: "-12%",
            width: "72vw", height: "72vh",
            background: "radial-gradient(ellipse 50% 56% at 32% 48%, rgba(90,0,180,0.5) 0%, transparent 58%)",
            filter: "blur(55px)",
          }}
        />
      </motion.div>

      {/* Blob 3 â€” dark violet, bottom-right */}
      <motion.div
        className="absolute inset-0"
        style={{ y: y3 }}
        animate={{ x: ["0%","8%","-5%","4%","0%"], scale:[1,1.1,0.94,1.05,1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      >
        <div
          className="absolute"
          style={{
            bottom: "-5%", right: "-12%",
            width: "85vw", height: "72vh",
            background:
              "radial-gradient(ellipse 46% 50% at 68% 68%, rgba(80,0,160,0.45) 0%, transparent 52%)," +
              "radial-gradient(ellipse 36% 36% at 85% 82%, rgba(0,50,160,0.3) 0%, transparent 50%)",
            filter: "blur(60px)",
          }}
        />
      </motion.div>

      {/* Pinpoint accent â€” electric blue near top */}
      <motion.div
        className="absolute"
        animate={{ opacity:[0.1,0.2,0.1], scale:[1,1.25,1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          top: "3%", left: "37%",
          width: "460px", height: "300px",
          background: "radial-gradient(ellipse at center, rgba(0,85,255,0.22) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 32%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}

