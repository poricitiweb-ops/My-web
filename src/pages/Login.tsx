import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ScanLine, Mail, Lock, ArrowRight, Loader2, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import Footer from '../components/Footer';

export default function Login() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if the identifier is email, phone, or special admin username
    const trimmedId = identifier.trim();
    let finalEmail = '';
    let finalPassword = password;

    if (trimmedId === 'A' && password === '123456') {
      const email1 = 'poriciti.web@gmail.com';
      const email2 = 'admin@poriciti.com';

      try {
        console.log("Admin login: trying sign-in with poriciti.web@gmail.com");
        await signInWithEmailAndPassword(auth, email1, '123456');
        navigate('/dashboard');
        return;
      } catch (err: any) {
        console.log("Admin login email1 failed:", err.code);
        // Try creating / registering the admin with poriciti.web@gmail.com
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential') {
          try {
            console.log("Admin login: trying sign-up with poriciti.web@gmail.com");
            const res = await createUserWithEmailAndPassword(auth, email1, '123456');
            await setDoc(doc(db, 'users', res.user.uid), {
              userId: res.user.uid,
              name: 'Admin',
              bio: 'System Administrator',
              photoURL: '',
              phoneNumber: '',
              mobileNumber: '',
              paymentStatus: 'paid',
              socialLinks: [],
              views: 0,
              isSuspended: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            navigate('/dashboard');
            return;
          } catch (signupErr: any) {
            console.log("Admin login email1 signup failed:", signupErr.code);
          }
        }
      }

      // Fallback: try email2 (admin@poriciti.com)
      try {
        console.log("Admin login: trying sign-in with admin@poriciti.com");
        await signInWithEmailAndPassword(auth, email2, '123456');
        navigate('/dashboard');
        return;
      } catch (err: any) {
        console.log("Admin login email2 failed:", err.code);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          try {
            console.log("Admin login: trying sign-up with admin@poriciti.com");
            const res = await createUserWithEmailAndPassword(auth, email2, '123456');
            await setDoc(doc(db, 'users', res.user.uid), {
              userId: res.user.uid,
              name: 'Admin',
              bio: 'System Administrator',
              photoURL: '',
              phoneNumber: '',
              mobileNumber: '',
              paymentStatus: 'paid',
              socialLinks: [],
              views: 0,
              isSuspended: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            navigate('/dashboard');
            return;
          } catch (signupErr: any) {
            setError(`এডমিন তৈরিতে ব্যর্থতা: ${signupErr.message}`);
            setLoading(false);
            return;
          }
        }
        setError(`এডমিন লগইনে ব্যর্থতা: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    const lowerId = trimmedId.toLowerCase();
    const isEmail = lowerId.includes('@');
    const digitsOnly = lowerId.replace(/\D/g, '');
    
    if (!isEmail && digitsOnly.length < 10) {
      setError('দয়া করে সঠিক মোবাইল নম্বর অথবা ইমেইল দিন।');
      setLoading(false);
      return;
    }
    finalEmail = isEmail ? lowerId : `${digitsOnly}@phone.card`;

    try {
      await signInWithEmailAndPassword(auth, finalEmail, finalPassword);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('এই নম্বর বা ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      } else if (err.code === 'auth/wrong-password') {
        setError('পাসওয়ার্ড সঠিক নয়।');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('ইমেইল/পাসওয়ার্ড অথেন্টিকেশন সচল করা নেই। অনুগ্রহ করে সেটিংস চেক করুন।');
      } else {
        setError(t.login.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-emerald-100">
      <div className="flex-grow flex flex-col md:flex-row">
        <div className="hidden md:flex flex-1 bg-emerald-950 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent"></div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 rotate-3 shadow-2xl">
              <ScanLine size={28} />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-bold tracking-tight">{t.appName}</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Connect Smarter</span>
            </div>
          </div>
          <div className="space-y-6 max-w-xl">
            <h2 className="text-5xl font-extrabold leading-tight tracking-tighter">{t.login.heroTitle}</h2>
            <p className="text-emerald-400/60 text-lg leading-relaxed">"{t.login.quote}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-900 rounded-full border border-emerald-800 flex items-center justify-center">
                <User className="text-emerald-400" size={24} />
              </div>
              <div>
                <div className="font-bold text-emerald-50">{t.login.testimonialAuthor}</div>
                <div className="text-sm font-medium text-emerald-400/60 uppercase tracking-widest">{t.login.testimonialRole}</div>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-sm text-emerald-900/40 font-medium">© 2024 {t.appName} Inc. All rights reserved.</div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12">
          <div className="max-w-md w-full mx-auto space-y-12">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-950 rounded-xl flex items-center justify-center text-white rotate-3 shadow-xl">
                  <ScanLine size={24} />
                </div>
                <div className="flex flex-col -space-y-1">
                  <span className="text-xl font-bold tracking-tight text-emerald-950">{t.appName}</span>
                  <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Connect Smarter</span>
                </div>
              </div>
              <LanguageSwitcher />
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">
                {t.login.title}
              </h1>
              <p className="text-emerald-900/60 font-medium leading-relaxed">
                {t.login.subtitle} <Link to="/signup" className="text-emerald-600 font-bold hover:underline underline-offset-4">{t.login.createAccount}</Link>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-emerald-900/40">ইমেইল অথবা ফোন নম্বর</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-emerald-50/20 border border-emerald-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-medium"
                    placeholder="name@example.com অথবা 017XXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-widest text-emerald-900/40">{t.login.password}</label>
                  <a href="#" className="text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider">{t.login.forgotPassword}</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/30 group-focus-within:text-emerald-600 transition-colors" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-emerald-50/20 border border-emerald-100 rounded-xl px-12 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-medium"
                    placeholder={t.login.passwordPlaceholder}
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm font-bold text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100 mt-4 active:shadow-inner"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>{t.login.signIn} <ArrowRight size={18} /></>}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

declare global {
  interface Window {
  }
}
