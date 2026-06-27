import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Shield, Zap, Sparkles } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 }
};

const LandingPage = () => {
  return (
    <div className="landing-wrapper">

      {/* Glow Background */}
      <div className="bg-glow" />

      {/* HERO */}
      <section className="hero-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="hero-badge"
        >
          <Sparkles size={14} />
          AI-Powered Exam Evaluation
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hero-title"
        >
          Smarter Exams. Faster Grading.
          <br />
          <span>Powered by AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hero-subtitle"
        >
          Create exams, evaluate answers automatically, and get instant insights with intelligent AI grading.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button className="btn-primary">
            Get Started <ArrowRight size={16} />
          </button>

          <button className="btn-secondary">
            View Demo
          </button>
        </motion.div>
      </section>

      {/* FEATURES */}
      <motion.section
        className="features"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          {
            icon: Brain,
            title: "AI Grading",
            desc: "Automatically evaluate answers with smart AI models."
          },
          {
            icon: Zap,
            title: "Fast Results",
            desc: "Get results in seconds instead of hours."
          },
          {
            icon: Shield,
            title: "Secure System",
            desc: "Your exams and data are fully protected."
          }
        ].map((f, i) => (
          <motion.div key={i} className="feature-card" variants={item}>
            <f.icon className="icon" />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* CTA SECTION */}
      <motion.section
        className="cta"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2>Ready to modernize your exams?</h2>
        <p>Join educators already using AI to grade smarter.</p>
        <button className="btn-primary">
          Start Now <ArrowRight size={16} />
        </button>
      </motion.section>
    </div>
  );
};

export default LandingPage;