import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { Construction } from "lucide-react";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } } };

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <PageHeader title={title} description={description} />
      </motion.div>
      <motion.div variants={fadeUp}>
        <div
          className="rounded-2xl backdrop-blur-xl p-16 text-center"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}
        >
          <Construction className="h-6 w-6 mx-auto mb-3" style={{ color: "var(--t-text-dim)" }} />
          <p className="text-[13px]" style={{ color: "var(--t-text-tertiary)" }}>
            Esta pÃ¡gina estÃ¡ en construcciÃ³n
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

