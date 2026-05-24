import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Linkedin, 
  MessageSquare,
  Globe,
  Share2,
  CreditCard,
  User,
  ExternalLink,
  Twitter,
  ChevronRight,
  ArrowLeft,
  Eye,
  Ban,
  Music2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Footer from '../components/Footer';

export default function Profile() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<'not-found' | 'permission-denied' | 'unknown' | null>(null);

  const isOwner = !!currentUser && !!userId && currentUser.uid === userId;

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          
          // Safety migration for old object-based socialLinks
          if (userData.socialLinks && !Array.isArray(userData.socialLinks)) {
            const oldLinks = userData.socialLinks as any;
            userData.socialLinks = Object.entries(oldLinks)
              .filter(([_, value]) => !!value)
              .map(([platform, value]) => ({ platform, value: value as string }));
          } else if (!userData.socialLinks) {
            userData.socialLinks = [];
          }
          
          setProfile(userData);
          // Increment view count
          updateDoc(docRef, {
            views: increment(1)
          }).catch(console.error);
        } else {
          setErrorStatus('not-found');
        }
      } catch (err) {
        console.error('Profile Fetch Error:', err);
        if (err instanceof Error && (err.message.includes('permission') || err.message.includes('denied'))) {
          setErrorStatus('permission-denied');
        } else {
          setErrorStatus('unknown');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  const socialIcons = {
    facebook: <Facebook size={24} />,
    instagram: <Instagram size={24} />,
    youtube: <Youtube size={24} />,
    linkedin: <Linkedin size={24} />,
    whatsapp: <MessageSquare size={24} />,
    x: <Twitter size={24} />,
    tiktok: <Music2 size={24} />,
    website: <Globe size={24} />
  };

  const socialBaseUrls = {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    youtube: 'https://youtube.com/c/',
    linkedin: 'https://linkedin.com/in/',
    whatsapp: 'https://wa.me/',
    x: 'https://x.com/',
    tiktok: 'https://tiktok.com/@'
  };

  const getFullUrl = (key: string, value: any) => {
    const val = String(value);
    if (val.startsWith('http')) return val;
    return ((socialBaseUrls as any)[key] || '') + val;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorStatus || !profile || (profile.isSuspended && !isOwner)) {
    const isSuspendedError = profile?.isSuspended && !isOwner;
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className={`w-24 h-24 ${isSuspendedError ? 'bg-red-50 text-red-400' : 'bg-emerald-50 text-emerald-400'} rounded-full flex items-center justify-center mb-6`}>
          {isSuspendedError ? <Ban size={40} /> : <Globe size={40} />}
        </div>
        <h1 className="text-2xl font-bold text-gray-950 mb-2">
          {isSuspendedError 
            ? 'এই কার্ডটি বর্তমানে স্থগিত করা হয়েছে' 
            : (errorStatus === 'permission-denied' ? 'অ্যাক্সেস অনুমোদিত নয়' : 'কার্ডটি পাওয়া যায়নি')}
        </h1>
        <p className="text-gray-500 max-w-xs mb-8">
          {isSuspendedError
            ? 'অ্যাডমিন এই প্রোফাইলটি সাময়িকভাবে বন্ধ করে রেখেছেন। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
            : (errorStatus === 'permission-denied' 
              ? 'দুঃখিত, এই প্রোফাইলটি দেখার অনুমতি আপনার নেই।' 
              : 'অনুগ্রহ করে লিঙ্কটি চেক করুন বা পরে আবার চেষ্টা করুন।')}
        </p>
        <Link to="/" className="px-8 py-3 bg-emerald-950 text-white rounded-xl font-bold transition-all">
          হোম পেজে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] font-sans selection:bg-emerald-100 min-w-fit sm:min-w-0">
      {/* Visual Header */}
      <div className="h-[30vh] w-full bg-emerald-950 relative overflow-hidden min-w-full">
        {isOwner && (
          <Link 
            to="/dashboard" 
            className="absolute top-8 left-8 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} /> ড্যাশবোর্ড
          </Link>
        )}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[120%] rounded-full bg-emerald-800/20 blur-[100px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] rounded-full bg-emerald-400/10 blur-[80px]"></div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 -mt-32 relative z-10 flex-grow">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-emerald-50 p-8 md:p-12 space-y-12"
        >
          {/* Identity Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <div className="w-40 h-40 rounded-[3rem] bg-emerald-50/50 border-[6px] border-white shadow-2xl overflow-hidden ring-1 ring-emerald-50">
                {profile.photoURL && !imageError ? (
                  <img 
                    src={profile.photoURL} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    loading="eager"
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-900/10">
                    <User size={80} />
                  </div>
                )}
              </div>
            </motion.div>
            
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">{profile.name}</h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-700 font-bold uppercase tracking-widest text-[10px]">পেশাদার প্রোফাইল</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Social Presence */}
          <div className="grid grid-cols-1 gap-4">
            {(profile.socialLinks || []).map((link, i) => {
              if (!link.value) return null;
              return (
                <motion.a
                  key={i}
                  href={getFullUrl(link.platform, link.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  whileHover={{ x: 5, backgroundColor: '#F0F9F6' }}
                  className="flex items-center gap-6 p-6 rounded-3xl border border-emerald-50/50 bg-emerald-50/20 hover:bg-white hover:border-emerald-200 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-950 shadow-sm border border-emerald-50 group-hover:bg-emerald-950 group-hover:text-white transition-all">
                    {(socialIcons as any)[link.platform]}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-bold text-emerald-950 capitalize block tracking-tight">{link.platform}</span>
                    <span className="text-xs text-gray-500 font-medium">কানেক্ট করুন</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-950 transition-colors" />
                </motion.a>
              );
            })}
          </div>

          {/* Global Actions */}
          <div className="pt-8 space-y-4">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: `${profile.name}'s Card`, url });
                } else {
                  navigator.clipboard.writeText(url);
                  // Using a simple state for copy success would be better, but staying consistent with existing logic
                  alert('লিঙ্ক কপি হয়েছে!');
                }
              }}
              className="w-full bg-emerald-950 text-white py-6 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-emerald-100/50"
            >
              <Share2 size={22} /> কার্ড শেয়ার করুন
            </motion.button>
            <div className="flex flex-col items-center gap-2 pt-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                <CreditCard size={12} /> ডিজিটাল কার্ড দ্বারা চালিত
              </div>
              <Link to="/" className="text-xs font-bold text-gray-500 hover:text-emerald-950 transition-colors uppercase tracking-widest mt-2 border-b border-transparent hover:border-emerald-950/20">নিজস্ব কার্ড তৈরি করুন</Link>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
