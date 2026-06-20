import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, ReferralCode } from '../types';
import { 
  Users, 
  ShieldCheck, 
  Ban, 
  CheckCircle, 
  Search, 
  Trash2, 
  Eye, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Phone,
  Hash,
  BadgeCheck,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  ScanLine,
  Tag,
  Percent,
  Gift,
  Video,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Footer from '../components/Footer';

export default function Admin() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'suspended' | 'verified' | 'unverified' | 'recent'>('all');

  // Referral states
  const [refCode, setRefCode] = useState('');
  const [refDiscount, setRefDiscount] = useState(10);
  const [friendDiscount, setFriendDiscount] = useState(15);
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [referralCodesList, setReferralCodesList] = useState<ReferralCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(10);
  const [savingNewPromo, setSavingNewPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [savingRef, setSavingRef] = useState(false);
  const [refMessage, setRefMessage] = useState('');

  const isAdmin = currentUser?.email === 'poriciti.web@gmail.com' || currentUser?.email === 'admin@poriciti.com';

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchReferralConfigAndCodes() {
      try {
        const refDoc = await getDoc(doc(db, 'settings', 'referral'));
        if (refDoc.exists()) {
          const data = refDoc.data();
          setRefCode(data.code || '');
          setRefDiscount(data.discount || 0);
          setFriendDiscount(data.friendDiscount !== undefined ? data.friendDiscount : 15);
          setIsGlobalEnabled(data.isGlobalEnabled !== undefined ? data.isGlobalEnabled : true);
          setVideoUrl(data.videoUrl || '');
          setRewardAmount(data.rewardAmount || '');
        } else {
          setFriendDiscount(15);
          setIsGlobalEnabled(true);
          setVideoUrl('');
          setRewardAmount('');
        }

        // Fetch multiple promo codes
        setLoadingCodes(true);
        const promoSnap = await getDocs(query(collection(db, 'referralCodes')));
        const promoList = promoSnap.docs.map(d => d.data() as ReferralCode);
        setReferralCodesList(promoList);
      } catch (err: any) {
        console.error('Error fetching referral settings/codes:', err);
      } finally {
        setLoadingCodes(false);
      }
    }
    fetchReferralConfigAndCodes();
  }, [isAdmin]);

  const saveReferralConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (friendDiscount < 0 || friendDiscount > 100) {
      setRefMessage('বন্ধুদের ডিস্কাউন্ট হার ০ থেকে ১০০ এর মধ্যে হতে হবে।');
      return;
    }
    try {
      setSavingRef(true);
      setRefMessage('');
      await setDoc(doc(db, 'settings', 'referral'), {
        code: refCode.trim().toUpperCase(),
        discount: Number(refDiscount),
        friendDiscount: Number(friendDiscount),
        isGlobalEnabled: isGlobalEnabled,
        videoUrl: videoUrl.trim(),
        rewardAmount: rewardAmount.trim(),
        updatedAt: serverTimestamp()
      });
      setRefMessage('সেটিংস সফলভাবে আপডেট করা হয়েছে!');
    } catch (err: any) {
      console.error('Error saving referral config:', err);
      setRefMessage('সেটিংস সেভ করতে সমস্যা হয়েছে।');
      handleFirestoreError(err, OperationType.WRITE, 'settings/referral');
    } finally {
      setSavingRef(false);
    }
  };

  const handleAddPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newPromoCode.trim().toUpperCase();
    if (!formattedCode) {
      setPromoMessage('প্রোমো কোড অবশ্যই দিতে হবে।');
      return;
    }
    if (newPromoDiscount < 0 || newPromoDiscount > 100) {
      setPromoMessage('ডিস্কাউন্ট হার অবশ্যই ০ থেকে ১০০ এর মধ্যে হতে হবে।');
      return;
    }
    try {
      setSavingNewPromo(true);
      setPromoMessage('');
      
      const newPromo: ReferralCode = {
        code: formattedCode,
        discount: Number(newPromoDiscount),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'referralCodes', formattedCode), newPromo);
      
      setReferralCodesList(prev => {
        const filtered = prev.filter(p => p.code !== formattedCode);
        return [...filtered, newPromo];
      });

      setNewPromoCode('');
      setPromoMessage('নতুন প্রোমো কোড সফলভাবে যোগ করা হয়েছে!');
    } catch (err: any) {
      console.error('Error adding promo code:', err);
      setPromoMessage('প্রোমো কোড যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setSavingNewPromo(false);
    }
  };

  const handleTogglePromoCode = async (code: string, currentStatus: boolean) => {
    try {
      const codeRef = doc(db, 'referralCodes', code);
      await updateDoc(codeRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      setReferralCodesList(prev => 
        prev.map(p => p.code === code ? { ...p, isActive: !currentStatus } : p)
      );
    } catch (err: any) {
      console.error('Error toggling promo code status:', err);
      alert('স্ট্যাটাস পরিবর্তন সফল হয়নি।');
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    if (!window.confirm(`আপনি কি সত্যিই '${code}' কোডটি মুছে ফেলতে চান?`)) return;
    try {
      await deleteDoc(doc(db, 'referralCodes', code));
      setReferralCodesList(prev => prev.filter(p => p.code !== code));
    } catch (err: any) {
      console.error('Error deleting promo code:', err);
      alert('কোড মুছতে ব্যর্থ হয়েছে।');
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    async function fetchUsers() {
      try {
        setLoading(true);
        setError('');
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          userId: doc.id
        }) as UserProfile);
        setUsers(usersList);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError('ইউজার ডাটা লোড করতে সমস্যা হচ্ছে। আপনি কি নিশ্চিত যে আপনি এডমিন?');
        handleFirestoreError(err, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [isAdmin, navigate]);

  const [error, setError] = useState('');

  const toggleStatus = async (userId: string, currentStatus: boolean | undefined) => {
    try {
      setError('');
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus; // Robust toggle
      await updateDoc(userRef, {
        isSuspended: newStatus,
        updatedAt: serverTimestamp()
      });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isSuspended: newStatus } : u));
    } catch (err: any) {
      setError('স্ট্যাটাস আপডেট করা যায়নি।');
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const toggleVerification = async (userId: string, currentVerified: boolean | undefined) => {
    try {
      setError('');
      const userRef = doc(db, 'users', userId);
      const newVal = !currentVerified;
      await updateDoc(userRef, {
        isVerified: newVal,
        updatedAt: serverTimestamp()
      });
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isVerified: newVal } : u));
    } catch (err: any) {
      setError('ভেরিফিকেশন আপডেট করা যায়নি।');
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const togglePayment = async (userId: string, currentStatus: string) => {
    try {
      setError('');
      const userRef = doc(db, 'users', userId);
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const updateData: any = {
        paymentStatus: newStatus,
        updatedAt: serverTimestamp()
      };
      
      // If marking as paid, also set a paymentDate if it doesn't exist
      if (newStatus === 'paid') {
        updateData.paymentDate = serverTimestamp();
        // Set expiry date to 13 months from now
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 13);
        updateData.expiryDate = expiry.toISOString();
      }

      await updateDoc(userRef, updateData);
      setUsers(prev => prev.map(u => u.userId === userId ? { 
        ...u, 
        paymentStatus: newStatus as any,
        paymentDate: newStatus === 'paid' ? { seconds: Math.floor(Date.now() / 1000) } : u.paymentDate
      } : u));
    } catch (err: any) {
      setError('পেমেন্ট স্ট্যাটাস আপডেট করা যায়নি।');
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি এই ইউজারটি মুছতে চান? এটি আর ফিরিয়ে আনা যাবে না!')) return;
    try {
      setError('');
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch (err: any) {
      setError('ইউজার ডিলিট করা যায়নি।');
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  const filteredUsers = users
    .filter(u => {
      const searchMatch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (u.senderNumber || '').includes(searchTerm) ||
                          (u.phoneNumber || '').includes(searchTerm) ||
                          (u.lastTrxId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const now = new Date().getTime();
      let createdAtTime = 0;
      if (u.createdAt) {
        createdAtTime = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : new Date(u.createdAt).getTime();
      }
      const isRecent = (now - createdAtTime) < 24 * 60 * 60 * 1000;

      if (filter === 'all') return searchMatch;
      if (filter === 'paid') return searchMatch && u.paymentStatus === 'paid';
      if (filter === 'pending') return searchMatch && u.paymentStatus === 'pending';
      if (filter === 'suspended') return searchMatch && u.isSuspended;
      if (filter === 'verified') return searchMatch && u.isVerified;
      if (filter === 'unverified') return searchMatch && !u.isVerified;
      if (filter === 'recent') return searchMatch && isRecent;
      return searchMatch;
    })
    .sort((a, b) => {
      const dateA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

  const getDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateRevenue = (period: '24h' | '7d' | '1m' | '1y' | 'total') => {
    const now = new Date().getTime();
    const paidUsers = users.filter(u => u.paymentStatus === 'paid' && !u.isSuspended);
    
    if (period === 'total') return paidUsers.length * 51;

    let limit = 0;
    if (period === '24h') limit = 24 * 60 * 60 * 1000;
    if (period === '7d') limit = 7 * 24 * 60 * 60 * 1000;
    if (period === '1m') limit = 30 * 24 * 60 * 60 * 1000;
    if (period === '1y') limit = 365 * 24 * 60 * 60 * 1000;

    return paidUsers.filter(u => {
      if (!u.paymentDate) return false;
      const paymentTime = u.paymentDate?.seconds ? u.paymentDate.seconds * 1000 : new Date(u.paymentDate).getTime();
      return (now - paymentTime) < limit;
    }).length * 51;
  };

  const recentUsersCount = users.filter(u => {
    const now = new Date().getTime();
    const createdAtTime = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : new Date(u.createdAt).getTime();
    return (now - createdAtTime) < 24 * 60 * 60 * 1000;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans selection:bg-emerald-100 min-w-fit sm:min-w-0">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full min-w-full">
        {error && (
          <div className="bg-red-500 text-white text-center py-2 text-xs font-bold animate-pulse">
            {error}
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-950 rounded-lg flex items-center justify-center text-white shadow-md border border-emerald-800/30">
                <ScanLine size={16} />
              </div>
              <div className="flex items-center">
                <span className="font-black tracking-tighter text-emerald-950 font-bengali text-xl">পরিচিতি</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">
              Root Access
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 flex-grow">
        {/* Revenue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Today Revenue', val: calculateRevenue('24h'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Weekly Revenue', val: calculateRevenue('7d'), color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Monthly Revenue', val: calculateRevenue('1m'), color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Yearly Revenue', val: calculateRevenue('1y'), color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Total Revenue', val: calculateRevenue('total'), color: 'text-gray-900', bg: 'bg-gray-100' }
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm`}>
              <p className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] sm:text-[10px] font-black text-gray-400">৳</span>
                <p className={`text-lg sm:text-2xl font-black ${stat.color}`}>{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Users</p>
              <Users size={16} className="text-gray-300" />
            </div>
            <p className="text-3xl font-black text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Users</p>
              <BadgeCheck size={16} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black text-blue-600">{users.filter(u => u.isVerified).length}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Clock size={60} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined Today</p>
                <TrendingUp size={16} className="text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600">{recentUsersCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suspended</p>
              <Ban size={16} className="text-red-300" />
            </div>
            <p className="text-3xl font-black text-red-600">{users.filter(u => u.isSuspended).length}</p>
          </div>
        </div>

        {/* Referral Program Admin Settings */}
        <div className="space-y-8 mb-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm animate-fade-in text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Gift size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 font-bengali">রেফারেল প্রোগ্রাম সেটিংস</h2>
                  <p className="text-xs text-gray-400">পুরো প্রগ্রামের সক্রিয়তা এবং বন্ধুদের রেফারেল ডিস্কাউন্টের সেটিংস</p>
                </div>
              </div>

              {/* Master Global Toggle */}
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200 shrink-0 select-none">
                <span className="text-xs font-black uppercase text-gray-500 font-bengali">সব রেফারেল কোড:</span>
                <button
                  type="button"
                  onClick={() => setIsGlobalEnabled(!isGlobalEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isGlobalEnabled ? 'bg-emerald-600' : 'bg-red-400'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isGlobalEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold ${isGlobalEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isGlobalEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
            </div>

            <form onSubmit={saveReferralConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-2 font-bengali">বন্ধুদের জন্য ডিস্কাউন্ট হার (%)</label>
                <div className="relative">
                  <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="যেমন: ১৫"
                    min="0"
                    max="100"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-sm"
                    value={friendDiscount}
                    onChange={e => setFriendDiscount(Number(e.target.value))}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bengali">বন্ধুরা আপনার রেফার কোড ব্যবহার করলে তারা কতো % ছাড় পাবে।</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-2 font-bengali">রেফারকারীকে পুরষ্কার প্রদান (পরিমাণ বা শতাংশ)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="যেমন: ৩০% ডিস্কাউন্ট বা ৫০০ টাকা"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-sm"
                    value={rewardAmount}
                    onChange={e => setRewardAmount(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bengali">৩ জন মেসেঞ্জার শেয়ার সম্পন্ন হলে ইউজার যে পুরষ্কার (অর্থ/ডিস্কাউন্ট) পাবেন তার বিবরণ।</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase text-gray-500 tracking-wider mb-2 font-bengali">রেফারেল ভিডিও গাইডলাইন লিংক (YouTube Link)</label>
                <div className="relative">
                  <Video size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="url" 
                    placeholder="যেমন: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-sm"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bengali">ইউজারদের রেফারাল পোর্টালে এই গাইডলাইন ভিডিওটি দেখানো হবে।</p>
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={savingRef}
                  className="w-full bg-emerald-950 text-white font-black hover:bg-emerald-900 transition-colors py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {savingRef ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      সেভিং...
                    </>
                  ) : (
                    'গ্লোবাল সেটিংস আপডেট করুন'
                  )}
                </button>
              </div>
            </form>

            {refMessage && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold leading-relaxed flex items-center gap-2 ${
                refMessage.includes('সফলভাবে') ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
              }`}>
                <AlertCircle size={16} className="shrink-0" />
                <span>{refMessage}</span>
              </div>
            )}
          </div>

          {/* Multiple Promo/Referral Codes Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            {/* Create Code Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 text-sm font-bengali">নতুন প্রোমো কোড তৈরি করুন</h3>
                <p className="text-xs text-gray-450">তৈরিকৃত কোডগুলো যেকোনো ইউজার সাবস্ক্রিপশন কেনার সময় ব্যবহার করতে পারবে</p>
              </div>

              <form onSubmit={handleAddPromoCode} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5 font-bengali">কোড নাম</label>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="যেমন: SPECIAL30"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-mono font-bold text-xs tracking-wider"
                      value={newPromoCode}
                      onChange={e => setNewPromoCode(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1.5 font-bengali">ডিস্কাউন্ট পারসেন্ট (%)</label>
                  <div className="relative">
                    <Percent size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="number" 
                      placeholder="যেমন: ৩০"
                      min="0"
                      max="100"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-bold text-xs"
                      value={newPromoDiscount}
                      onChange={e => setNewPromoDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingNewPromo}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 select-none cursor-pointer"
                >
                  {savingNewPromo ? <Loader2 size={12} className="animate-spin" /> : 'কোড তৈরি করুন'}
                </button>
              </form>

              {promoMessage && (
                <p className={`text-[11px] font-bold ${promoMessage.includes('সফলভাবে') ? 'text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg' : 'text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-lg'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Promo Codes List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-black text-gray-900 text-sm font-bengali">অ্যাক্টিভ প্রোমো কোড সমূহ</h3>

              {loadingCodes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                </div>
              ) : referralCodesList.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-xs">
                  কোনো প্রোমো কোড তৈরি করা হয়নি।
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bengali">কোড</th>
                        <th className="px-4 py-3 font-bengali">ডিস্কাউন্ট</th>
                        <th className="px-4 py-3 font-bengali">অবস্থা</th>
                        <th className="px-4 py-3 text-right font-bengali">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {referralCodesList.map((promo) => (
                        <tr key={promo.code} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-black text-gray-950 tracking-wider">
                            {promo.code}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-emerald-600 text-sm">
                            {promo.discount}%
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePromoCode(promo.code, promo.isActive)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider select-none cursor-pointer transition-colors ${
                                promo.isActive 
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                              }`}
                            >
                              {promo.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePromoCode(promo.code)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, number, trxID..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all font-medium text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-200 w-full xl:w-auto overflow-x-auto">
            {['all', 'paid', 'pending', 'verified', 'unverified', 'recent', 'suspended'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === f 
                    ? 'bg-emerald-950 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Details</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Status</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Account Status</th>
                <th className="px-4 sm:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    layout
                    key={user.userId} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 overflow-hidden flex-shrink-0">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-emerald-300">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-gray-900 leading-none truncate max-w-[150px]">{user.name}</p>
                            {user.isVerified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[9px] text-gray-400 font-mono truncate max-w-[120px] mt-1">{user.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone size={12} className="text-gray-400" />
                          <span className="truncate max-w-[120px]">{user.senderNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Hash size={12} className="text-gray-400" />
                          <span className="font-mono text-[9px] uppercase truncate max-w-[120px]">{user.lastTrxId || 'No TrxID'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => togglePayment(user.userId, user.paymentStatus)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                            user.paymentStatus === 'paid' 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {user.paymentStatus === 'paid' ? (
                            <><CheckCircle size={14} /> Paid</>
                          ) : (
                            <><AlertCircle size={14} /> Pending</>
                          )}
                        </button>
                        <button 
                          onClick={() => toggleVerification(user.userId, user.isVerified)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                            user.isVerified 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {user.isVerified ? (
                            <><UserCheck size={14} /> Verified</>
                          ) : (
                            <><UserX size={14} /> Verify? (No)</>
                          )}
                        </button>
                        {user.paymentStatus === 'paid' && (
                          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block text-center ${
                            (getDaysLeft(user.expiryDate) || 0) < 0 
                              ? 'bg-red-50 text-red-600' 
                              : (getDaysLeft(user.expiryDate) || 0) < 10 
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {(getDaysLeft(user.expiryDate) || 0) < 0 
                              ? 'Expired' 
                              : `${getDaysLeft(user.expiryDate)} Days Left`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        user.isSuspended 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.isSuspended ? (
                          <><Ban size={14} /> Suspended</>
                        ) : (
                          <><CheckCircle size={14} /> Active</>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/u/${user.userId}`} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => toggleStatus(user.userId, user.isSuspended)}
                          className={`p-2 rounded-lg transition-all ${
                            user.isSuspended 
                              ? 'text-green-500 hover:bg-green-50' 
                              : 'text-amber-500 hover:bg-amber-100'
                          }`}
                          title={user.isSuspended ? "Activate" : "Suspend"}
                        >
                          {user.isSuspended ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                        <button 
                          onClick={() => deleteUser(user.userId)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">No users found</p>
              <p className="text-sm">Try different search term or filter.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
