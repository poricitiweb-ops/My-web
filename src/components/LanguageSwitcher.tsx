
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Languages } from 'lucide-react';
import { motion } from 'motion/react';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-bold transition-colors"
    >
      <Languages size={14} className="text-emerald-600" />
      <span>{language === 'bn' ? 'EN' : 'বাংলা'}</span>
    </motion.button>
  );
}
