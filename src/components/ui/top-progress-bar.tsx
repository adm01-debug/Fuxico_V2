import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function TopProgressBar() {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    // Show progress bar briefly on mount (simulating route change start)
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '100%', opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed top-0 left-0 h-1 bg-primary z-[100] shadow-[0_0_10px_rgba(var(--primary),0.5)]"
        />
      )}
    </AnimatePresence>
  )
}
