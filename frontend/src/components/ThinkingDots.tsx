import { motion } from 'framer-motion'

export default function ThinkingDots() {
  return (
    <div className="flex items-center ml-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full mx-0.5 bg-white/90"
          style={{ boxShadow: '0 0 4px rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
