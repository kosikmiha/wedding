import { motion, type Variants } from 'motion/react'
import { Children, isValidElement, type ReactNode } from 'react'

export type SectionContentPhase =
  | 'hidden'
  | 'exitDown'
  | 'enterWait'
  | 'enterUp'
  | 'shown'

const container: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.15, staggerChildren: 0.03, staggerDirection: -1 },
  },
  exitDown: {
    opacity: 0,
    y: 36,
    transition: {
      duration: 0.42,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.04,
      staggerDirection: 1,
    },
  },
  enterWait: {
    opacity: 0,
    transition: { duration: 0 },
  },
  enterUp: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.075,
      staggerDirection: 1,
      delayChildren: 0.04,
    },
  },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0 },
  },
}

const child: Variants = {
  hidden: {
    opacity: 0,
    y: 0,
    transition: { duration: 0.1 },
  },
  exitDown: {
    opacity: 0,
    y: 48,
    filter: 'blur(6px)',
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
  enterWait: {
    opacity: 0,
    y: 40,
    rotateX: -4,
    filter: 'blur(8px)',
    transition: { duration: 0 },
  },
  enterUp: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 22,
      mass: 0.85,
    },
  },
  shown: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0 },
  },
}

type Props = {
  children: ReactNode
  className?: string
  phase: SectionContentPhase
}

const childMotionStyle = { transformStyle: 'preserve-3d' as const }

function AnimatedChild({ node }: { node: ReactNode }) {
  if (isValidElement(node)) {
    const t = node.type
    const { className: cn, children } = node.props as {
      className?: string
      children: ReactNode
    }
    if (t === 'p') {
      return (
        <motion.p variants={child} style={childMotionStyle} className={cn}>
          {children}
        </motion.p>
      )
    }
    if (t === 'blockquote') {
      return (
        <motion.blockquote variants={child} style={childMotionStyle} className={cn}>
          {children}
        </motion.blockquote>
      )
    }
  }
  return (
    <motion.div variants={child} style={childMotionStyle}>
      {node}
    </motion.div>
  )
}

/** Фазы задаёт родитель (Swiper): уход вниз, вход с задержкой снизу вверх. */
export function SectionEntrance({ children, className, phase }: Props) {
  return (
    <motion.div
      className={className}
      style={{ perspective: 1200 }}
      initial={false}
      animate={phase}
      variants={container}
    >
      {Children.toArray(children).map((node, i) => (
        <AnimatedChild key={isValidElement(node) ? node.key ?? i : i} node={node} />
      ))}
    </motion.div>
  )
}
