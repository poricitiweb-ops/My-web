import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ScanLine, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Footer from '../components/Footer';

export default function Signup() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Check if the identifier is email or phone
    const trimmedId = identifier.trim().toLowerCase();
    const isEmail = trimmedId.includes('@');
    const digitsOnly = trimmedId.replace(/\D/g, '');
    
    if (!isEmail && digitsOnly.length < 10) {
      setError('দয়া করে সঠিক মোবাইল নম্বর অথবা ইমেইল দিন।');
      setLoading(false);
      return;
    }

    const finalEmail = isEmail ? trimmedId : `${digitsOnly}@phone.card`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password);
      const user = userCredential.user;
      
      const userData = {
        userId: user.uid,
        name: name,
        bio: '',
        photoURL: '',
        phoneNumber: !isEmail ? identifier : '',
        mobileNumber: !isEmail ? identifier : '',
        paymentStatus: 'pending',
        socialLinks: [
          { platform: 'facebook', value: '' },
          { platform: 'whatsapp', value: !isEmail ? identifier : '' },
          { platform: 'instagram', value: '' },
          { platform: 'youtube', value: '' }
        ],
        views: 0,
        isSuspended: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(doc(db, 'users', user.uid), userData);
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.CREATE, `users/${user.uid}`);
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err: any) {
      console.error("Signup error details:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console. Please enable it in the Authentication > Sign-in method tab.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email or phone is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/20 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-emerald-950">অ্যাকাউন্ট তৈরি হয়েছে!</h2>
          <p className="text-emerald-900/60 leading-relaxed text-lg">
            আপনার অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে। এখন আপনি লগইন করতে পারেন।
          </p>
          <div className="pt-4">
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">{t.signup.goLogin}</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-emerald-100">
      <div className="flex-grow flex flex-col md:flex-row">
        <div className="hidden md:flex flex-1 bg-emerald-50 border-r border-emerald-100 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 grayscale-0 mix-blend-multiply transition-all">
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-200 blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-green-200 blur-[120px]"></div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-emerald-950 rotate-3 border border-emerald-100">
              <ScanLine size={28} />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-bold tracking-tight text-emerald-950">{t.appName}</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Digital Identity</span>
            </div>
          </div>
          <div className="space-y-6 max-w-xl mx-auto md:mx-0">
            <h2 className="text-5xl font-extrabold leading-tight text-emerald-950 tracking-tighter">{t.signup.heroTitle}</h2>
            <p className="text-gray-600 text-lg leading-relaxed">{t.signup.heroSubtitle}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-950">100%</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{t.signup.customizable}</div>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-950">Free</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{t.signup.unlimited}</div>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-sm text-gray-400 font-medium">© 2024 {t.appName} Digital Solutions.</div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 text-emerald-950">
          <div className="max-w-md w-full mx-auto space-y-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-950 rounded-xl flex items-center justify-center text-white rotate-3 shadow-xl">
                  <ScanLine size={24} />
                </div>
                <div className="flex flex-col -space-y-1">
                  <span className="text-xl font-bold tracking-tight text-emerald-950">{t.appName}</span>
                  <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Digital Identity</span>
                </div>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">{t.signup.title}</h1>
              <p className="text-gray-600 font-medium">{t.signup.subtitle} <Link to="/login" className="text-emerald-600 font-bold hover:underline underline-offset-4">{t.signup.loginHere}</Link></p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-900/40">{t.signup.name}</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-medium"
                    placeholder={t.signup.namePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-900/40">ইমেইল অথবা ফোন নম্বর</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-medium"
                    placeholder="name@example.com অথবা 017XXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-900/40">{t.signup.password}</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-medium"
                    placeholder={t.signup.passwordPlaceholder}
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm font-bold text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100 active:shadow-inner"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>{t.signup.createButton} <ArrowRight size={18} /></>}
              </motion.button>
              <p className="text-[10px] uppercase font-black tracking-tighter text-emerald-900/30 text-center px-4 leading-normal">{t.signup.legal}</p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
