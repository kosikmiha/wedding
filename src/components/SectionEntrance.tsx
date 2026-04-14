import { motion, type Variants } from 'motion/react'
import { Children, type ReactNode } from 'react'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.06,
    },
  },
}

const child: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    rotateX: -6,
    filter: 'blur(8px)',
  },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 20,
      mass: 0.85,
    },
  },
}

type Props = {
  children: ReactNode
  className?: string
  /** Увеличивать при уходе с секции — анимация снова с нуля при возврате. */
  replayVersion?: number
}

/** Ненавязчивая появление блоков секции: пружина + лёгкий blur + наклон по X. */
export function SectionEntrance({
  children,
  className,
  replayVersion = 0,
}: Props) {
  return (
    <motion.div
      key={replayVersion}
      className={className}
      style={{ perspective: 1200 }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.22, margin: '-10px' }}
      variants={container}
    >
      {Children.toArray(children).map((node, i) => (
        <motion.div
          key={i}
          variants={child}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {node}
        </motion.div>
      ))}
    </motion.div>
  )
}
