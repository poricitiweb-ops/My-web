import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';

export default function MessengerWidget() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show the friendly tooltip auto-hint after 3 seconds to attract attention elegantly
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    window.open('https://m.me/1184039758120128', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white text-gray-800 shadow-2xl border border-emerald-100 rounded-2xl p-3 pr-8 text-xs font-semibold font-bengali flex items-center gap-2 max-w-[200px] text-right relative select-none"
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.08))' }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-3 left-3" />
            <div className="pl-3">যেকোনো তথ্য বা সহায়তার জন্য মেসেজ দিন</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
            {/* Elegant speech bubble arrow */}
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-white border-r border-b border-emerald-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="messenger-widget-button"
        onClick={handleClick}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-shadow relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-blue-100"
        style={{
          background: 'linear-gradient(135deg, #0066FF 0%, #0099FF 30%, #A014FF 70%, #FF2A54 100%)',
          boxShadow: '0 8px 30px rgba(0, 102, 255, 0.4)'
        }}
        title="Contact us on Messenger"
      >
        {/* Ambient pulse background ring */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        
        {/* Custom accurate inline Messenger SVG */}
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill="currentColor"
          className="relative z-10 filter drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
        >
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.18 5.48 3.1 7.23V22l2.92-1.61c1.23.34 2.54.53 3.98.53 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm1.25 12.18l-2.42-2.58-4.73 2.58 5.2-5.52 2.47 2.58 4.68-2.58-5.2 5.52z"/>
        </svg>

        {/* Live indicator dot */}
        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white z-20 flex items-center justify-center shadow-sm">
          <span className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </span>
      </motion.button>
    </div>
  );
}
