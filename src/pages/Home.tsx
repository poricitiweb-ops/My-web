import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { 
  ScanLine,
  Clock,
  Send,
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import Footer from '../components/Footer';

export default function Home() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-emerald-950 font-sans selection:bg-emerald-100">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-950 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-emerald-900/10 border border-emerald-800/30">
            <ScanLine size={24} />
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-emerald-950 font-bengali">পরিচিতি</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <LanguageSwitcher />
          <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-emerald-950 transition-colors uppercase tracking-widest">{t.nav.login}</Link>
          <Link to="/signup" className="hidden sm:block text-sm font-black bg-emerald-950 text-white px-6 py-3 rounded-xl hover:bg-black transition-all shadow-xl shadow-emerald-50 tracking-widest uppercase">{t.home.getStarted}</Link>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left space-y-12">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">ডিজিটাল ভিজিটিং কার্ড</span>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.3] text-emerald-950"
            >
              {t.home.heroTitle}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              {t.home.heroSubtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8"
            >
              <Link to="/signup" className="group flex items-center gap-3 px-10 py-5 bg-emerald-950 text-white rounded-2xl font-black hover:bg-black transition-all shadow-2xl shadow-emerald-100 uppercase tracking-widest text-xs">
                {t.home.getStarted} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="px-10 py-5 border-2 border-gray-100 text-emerald-950 rounded-2xl font-black hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">
                {t.home.viewDemo}
              </Link>
            </motion.div>
          </div>

          {/* Right: Image Content (Justice for Hadi Illustration) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Background Accent */}
            <div className="absolute -inset-10 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            
            <div className="relative group">
              <div className="bg-emerald-950 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.35)] border-4 border-white">
                <img 
                  src="https://lh3.googleusercontent.com/d/14-J8_5q9D0nrEDWyDequlMcAupmPKbdx" 
                  alt="Shaheed Usman Hadi" 
                  className="w-full h-auto aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop";
                  }}
                />
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 sm:-bottom-10 sm:-right-10 w-32 h-32 sm:w-48 sm:h-48 bg-red-600 rounded-full flex items-center justify-center border-8 border-white shadow-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <span className="text-white text-xs sm:text-base font-black uppercase tracking-widest text-center leading-tight">
                  Justice<br />For<br />Hadi
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section - Minimalist */}
      <section className="bg-gray-50 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 sm:gap-16">
            {t.home.features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-6"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-950 border border-emerald-100 shadow-sm">
                  {i === 0 && <Clock size={20} />}
                  {i === 1 && <Send size={20} />}
                  {i === 2 && <Lock size={20} />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-emerald-950">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="max-w-7xl mx-auto px-6 py-40 text-center">
        <div className="max-w-2xl mx-auto space-y-12">
          <div className="flex justify-center text-emerald-900/10">
            <UserCheck size={80} strokeWidth={1} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-emerald-950 leading-tight">
            আপনার প্রফেশনাল পরিচয় এখন আরও আপডেট। স্মার্ট হোন, ডিজিটাল কার্ড ব্যবহার করুন।
          </h2>
          <div className="pt-8">
            <Link to="/signup" className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40 hover:text-emerald-950 transition-colors">এখনই শুরু করুন</Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
