import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
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
  ScanLine
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

  const isAdmin = currentUser?.email === 'poriciti.web@gmail.com';

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
        // Set expiry date to 1 year from now
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
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
