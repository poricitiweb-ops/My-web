import React, { useEffect, useState, useRef } from 'react';
// Porichiti Digital Card - Sync Triggered
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { toPng } from 'html-to-image';
import { UserProfile } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Phone,
  LogOut, 
  ExternalLink, 
  Save, 
  User, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle2,
  CreditCard,
  Menu,
  X,
  Share2,
  ScanLine,
  Lock,
  Download,
  Camera,
  Upload,
  Eye,
  ShieldCheck,
  Ban,
  Plus,
  Trash2,
  Tag,
  Gift,
  Percent,
  Copy,
  Heart,
  MoreVertical,
  Video,
  ArrowLeft
} from 'lucide-react';
import { 
  FacebookIcon, 
  WhatsAppIcon, 
  InstagramIcon, 
  YouTubeIcon, 
  LinkedInIcon, 
  TikTokIcon, 
  XIcon, 
  GlobeIcon 
} from '../components/BrandIcons';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Footer from '../components/Footer';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'public' | 'download' | 'subscription' | 'referral'>('info');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMoreSocials, setShowMoreSocials] = useState(false);
  
  // Subscription form states
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submittingTrx, setSubmittingTrx] = useState(false);

  // Referral states
  const [referralInput, setReferralInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [recommenderName, setRecommenderName] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [personalRefCopied, setPersonalRefCopied] = useState(false);
  const [isThreeDotOpen, setIsThreeDotOpen] = useState(false);
  const [isBestFriendCodeApplied, setIsBestFriendCodeApplied] = useState(false);
  const [bestFriendOwnerId, setBestFriendOwnerId] = useState('');
  const [friendDiscount, setFriendDiscount] = useState(15);
  const [videoUrl, setVideoUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');

  // Auto-apply if referee query param is present on mount
  useEffect(() => {
    const refParam = new URLSearchParams(window.location.search).get('ref');
    if (refParam) {
      setReferralInput(refParam);
      // Wait for currentUser to ensure we don't apply self-referral
      if (currentUser) {
        checkAndApplyCode(refParam);
      }
    }
  }, [currentUser]);

  const checkAndApplyCode = async (codeToApply?: string) => {
    const code = (codeToApply || referralInput).trim();
    if (!code) {
      setCodeError('অনুগ্রহ করে একটি রেফার কোড লিখুন।');
      return;
    }

    setCheckingCode(true);
    setCodeError('');
    setCodeSuccess('');

    try {
      // Fetch global settings
      let globalActive = true;
      let configuredFriendDiscount = 15;

      const refSettingDoc = await getDoc(doc(db, 'settings', 'referral'));
      if (refSettingDoc.exists()) {
        const adminSettings = refSettingDoc.data();
        globalActive = adminSettings.isGlobalEnabled !== undefined ? adminSettings.isGlobalEnabled : true;
        configuredFriendDiscount = adminSettings.friendDiscount !== undefined ? adminSettings.friendDiscount : 15;
        setFriendDiscount(configuredFriendDiscount);
      }

      if (!globalActive) {
        setCodeError('দুঃখিত, আডমিন থেকে রেফারেল সুবিধাটি বর্তমানে সাময়িকভাবে বন্ধ রাখা হয়েছে।');
        setCheckingCode(false);
        return;
      }

      // 1. Check if matches custom promo/referral codes created by admin in referralCodes collection
      const promoDoc = await getDoc(doc(db, 'referralCodes', code.toUpperCase()));
      if (promoDoc.exists()) {
        const promoData = promoDoc.data();
        if (promoData.isActive) {
          setDiscountPercent(promoData.discount || 0);
          setAppliedCode(code.toUpperCase());
          setCodeSuccess(`অভিনন্দন! "${code.toUpperCase()}" কোডটি সফলভাবে প্রয়োগ করা হয়েছে। আপনি পাচ্ছেন ${promoData.discount}% বিশেষ ডিস্কাউন্ট!`);
          setRecommenderName('');
          setIsBestFriendCodeApplied(false);
          setBestFriendOwnerId('');
          setCheckingCode(false);
          return;
        } else {
          setCodeError('দুঃখিত, এই ওয়ান-টাইম প্রোমো কোডটি বর্তমানে নিষ্ক্রিয় করা আছে।');
          setCheckingCode(false);
          return;
        }
      }

      // Backup Legacy check for the single setting / settings/referral
      if (refSettingDoc.exists()) {
        const adminData = refSettingDoc.data();
        if (adminData.code && adminData.code.trim().toUpperCase() === code.trim().toUpperCase()) {
          setDiscountPercent(adminData.discount || 0);
          setAppliedCode(code.toUpperCase());
          setCodeSuccess(`অভিনন্দন! "${code.toUpperCase()}" কোডটি সফলভাবে প্রয়োগ করা হয়েছে। আপনি পাচ্ছেন ${adminData.discount}% বিশেষ ডিস্কাউন্ট!`);
          setRecommenderName('');
          setIsBestFriendCodeApplied(false);
          setBestFriendOwnerId('');
          setCheckingCode(false);
          return;
        }
      }

      // 2. Check if matches Best Friend Referral Code (Syntax: BF-friendUid)
      if (code.toUpperCase().startsWith('BF-')) {
        const friendUid = code.substring(3).trim();
        if (friendUid === currentUser?.uid) {
          setCodeError('আপনি নিজের বেস্ট ফ্রেন্ড রেফার কোড ব্যবহার করতে পারবেন না!');
          setCheckingCode(false);
          return;
        }

        const friendDoc = await getDoc(doc(db, 'users', friendUid));
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          if (friendData.bestFriendCodeUsed) {
            setCodeError('দুঃখিত, এই ওয়ান-টাইম বেস্ট ফ্রেন্ড কোডটি ইতিমধ্যে অন্য এক বন্ধু ব্যবহার করে ফেলেছে!');
            setCheckingCode(false);
            return;
          }

          // Apply higher special Best Friend discount (e.g. 30% discount!)
          setDiscountPercent(30);
          setAppliedCode(code.toUpperCase());
          setRecommenderName(friendData.name || 'আপনার বেস্ট ফ্রেন্ড');
          setIsBestFriendCodeApplied(true);
          setBestFriendOwnerId(friendUid);
          setCodeSuccess(`অভিনন্দন! আপনার বেস্ট ফ্রেন্ড "${friendData.name || 'ইউজার'}" এর ওয়ান-টাইম কোড সফলভাবে প্রয়োগ করা হয়েছে। আপনি পাচ্ছেন ৩০% ডাবল ডিস্কাউন্ট!`);
          setCheckingCode(false);
          return;
        }
      }

      // We have removed general/personal user-to-user referrals; only Best Friend and Admin promo codes can be applied.
      setCodeError('ভুল রেফার কোড বা প্রোমো কোড! দয়া করে সঠিক কোডটি দিন।');
    } catch (err) {
      console.error('Error applying referral code:', err);
      setCodeError('রেফার কোড যাচাই করতে সমস্যা হয়েছে।');
    } finally {
      setCheckingCode(false);
    }
  };
  
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const cardBackRef = useRef<HTMLDivElement>(null);
  const cardFrontRef2 = useRef<HTMLDivElement>(null);
  const cardBackRef2 = useRef<HTMLDivElement>(null);
  const cardFrontRef3 = useRef<HTMLDivElement>(null);
  const cardBackRef3 = useRef<HTMLDivElement>(null);

  const publicUrl = window.location.origin + `/u/${currentUser?.uid}`;
  const isPaid = profile?.paymentStatus === 'paid';
  const isAdmin = currentUser?.email === 'poriciti.web@gmail.com' || currentUser?.email === 'admin@poriciti.com';
  const isSuspended = profile?.isSuspended;

  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser) return;
      try {
        // Load global settings
        try {
          const refSettingDoc = await getDoc(doc(db, 'settings', 'referral'));
          if (refSettingDoc.exists()) {
            const adminSettings = refSettingDoc.data();
            setVideoUrl(adminSettings.videoUrl || '');
            setRewardAmount(adminSettings.rewardAmount || '');
            setFriendDiscount(adminSettings.friendDiscount !== undefined ? adminSettings.friendDiscount : 15);
          }
        } catch (setErr) {
          console.error("Error loading referral global settings:", setErr);
        }

        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          
          // Migrate socialLinks from object to array if needed
          if (userData.socialLinks && !Array.isArray(userData.socialLinks)) {
            const oldLinks = userData.socialLinks as any;
            userData.socialLinks = Object.entries(oldLinks)
              .filter(([_, value]) => !!value)
              .map(([platform, value]) => ({ platform, value: value as string }));
            
            // If empty after filter, add some defaults
            if (userData.socialLinks.length === 0) {
              userData.socialLinks = [
                { platform: 'facebook', value: '' },
                { platform: 'whatsapp', value: userData.mobileNumber || '' },
                { platform: 'instagram', value: '' }
              ];
            }
          } else if (!userData.socialLinks) {
            userData.socialLinks = [];
          }
          
          // অটোমেটিক এক্সপায়ারি চেক (১ বছর পর)
          if (userData.paymentStatus === 'paid' && userData.expiryDate) {
            const expiry = new Date(userData.expiryDate);
            if (expiry < new Date()) {
              // মেয়াদ শেষ, তাই সাসপেন্ড করা হচ্ছে
              try {
                await updateDoc(docRef, {
                  paymentStatus: 'pending',
                  isSuspended: true,
                  updatedAt: serverTimestamp()
                });
                userData.paymentStatus = 'pending';
                userData.isSuspended = true;
              } catch (suspensionErr) {
                console.error("Automatic suspension failed:", suspensionErr);
                // Even if it fails, we continue so the user is not blocked from seeing their data
              }
            }
          }
          
          setProfile(userData);
        } else {
          // Initialize default profile if document doesn't exist
          setProfile({
            name: currentUser.displayName || '',
            mobileNumber: '',
            bio: '',
            photoURL: currentUser.photoURL || '',
            socialLinks: [
              { platform: 'facebook', value: '' },
              { platform: 'whatsapp', value: '' },
              { platform: 'instagram', value: '' }
            ],
            paymentStatus: 'pending',
            views: 0
          } as UserProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [currentUser]);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('ইমেজটির সাইজ ২ এমবি (2MB) এর বেশি হতে পারবে না।');
      return;
    }

    const envKey = import.meta.env.VITE_IMGBB_API_KEY;
    const hardcodedKey = 'f2938c279d4cb469fda24af9bb2fcb11';
    const apiKey = (envKey && envKey !== 'undefined' && envKey.length > 10 ? envKey : hardcodedKey).trim();
    
    if (!apiKey) {
      alert('ImgBB API Key পাওয়া যায়নি। দয়া করে এডমিনকে জানান।');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const downloadURL = data.data.url;
        setProfile(prev => prev ? { ...prev, photoURL: downloadURL } : null);
        setImageError(false);
        alert(' ছবিটি সফলভাবে সেট করা হয়েছে। এখন "তথ্য সেভ করুন" বাটনে ক্লিক করুন।');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('Invalid API v1 key')) {
        alert('আপনার দেওয়া API Key টি সঠিক নয় বলে মনে হচ্ছে।');
      } else {
        alert(`ইমেজ আপ্লোড করতে সমস্যা হয়েছে: ${message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      
      // Only send fields allowed by basic profile update rules
      const updatePayload = {
        name: profile.name,
        bio: profile.bio || '',
        photoURL: profile.photoURL || '',
        socialLinks: profile.socialLinks,
        mobileNumber: profile.mobileNumber || '',
        phoneNumber: profile.phoneNumber || '',
        updatedAt: serverTimestamp()
      };

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // Create new document if it doesn't exist
        await setDoc(docRef, {
          ...profile,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, updatePayload as any);
      }
      
      setShowSuccess(true);
      setError(null);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('তথ্য সেভ করতে সমস্যা হয়েছে।');
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMessengerShare = async () => {
    if (!currentUser) return;
    
    const currentShares = profile?.messengerShares || 0;
    const nextShares = Math.min(3, currentShares + 1);
    const generatedCode = profile?.referralCode || `REF-${currentUser.uid.substring(0, 8).toUpperCase()}`;
    const shareUrl = `${window.location.origin}/dashboard?ref=${generatedCode}`;
    
    // Step 1: Force copy the link immediately so the user can easily paste it.
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (clipErr) {
      console.warn("Could not copy link to clipboard automatically:", clipErr);
    }

    // Step 2: Open Messenger or native share sheet
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'পরিচিতি ডিজিটাল কার্ড',
          text: 'আমাদের পরিচিতি ডিজিটাল কার্ড দিয়ে মাত্র ১ মিনিটে নিজের QR কার্ড তৈরি করুন ও রেফার করুন!',
          url: shareUrl
        });
      } catch (shareErr) {
        console.log("Navigator share cancelled or failed, falling back:", shareErr);
        // Fallback to Messenger deep link scheme
        window.open(`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    } else if (isMobile) {
      // Mobile without navigator.share
      window.open(`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, '_blank');
    } else {
      // Desktop: Use robust Facebook Web Share dialog (contains Messenger share option inside it)
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(facebookShareUrl, '_blank', 'noopener,noreferrer');
    }
    
    // Step 3: Track the share status
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatePayload: any = {
        messengerShares: nextShares,
        updatedAt: serverTimestamp()
      };
      
      if (nextShares >= 3) {
        updatePayload.referralCode = generatedCode;
      }
      
      await updateDoc(userRef, updatePayload);
      setProfile(prev => prev ? {
        ...prev,
        messengerShares: nextShares,
        referralCode: nextShares >= 3 ? generatedCode : prev.referralCode
      } : null);
      
      if (nextShares === 3) {
        alert('অভিনন্দন! আপনার ৩ টি শেয়ার সফল হয়েছে এবং আপনার নতুন রেফারেল কোডটি আনলক করা হয়েছে! লিঙ্কটি ক্লিপবোর্ডে কপি করা হয়েছে।');
      } else {
        alert(`লিঙ্কটি ক্লিপবোর্ডে কপি করা হয়েছে এবং মেসেঞ্জার খোলার চেষ্টা করা হচ্ছে! শেয়ার ট্র্যাকিং কারেন্ট স্ট্যাটাস: (${nextShares}/৩)`);
      }
    } catch (err: any) {
      console.error("Error updating shares/referralCode:", err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpgradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || !senderNumber || !currentUser) return;
    
    setSubmittingTrx(true);
    try {
      // If Best Friend code used, mark it as used in the referrer's document (Action 4)
      if (isBestFriendCodeApplied && bestFriendOwnerId) {
        try {
          const refereeDocRef = doc(db, 'users', bestFriendOwnerId);
          await updateDoc(refereeDocRef, {
            bestFriendCodeUsed: true,
            bestFriendCodeUsedBy: currentUser.uid
          });
        } catch (friendErr: any) {
          console.error("Failed to mark referee Best Friend code as used:", friendErr);
        }
      }

      const docRef = doc(db, 'users', currentUser.uid);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const generatedRefCode = profile?.referralCode || `PORICITI-${currentUser.uid}`;

      const updateData: any = { 
        paymentStatus: 'paid',
        isSuspended: false,
        lastTrxId: trxId,
        senderNumber: senderNumber,
        paymentDate: serverTimestamp(),
        expiryDate: expiryDate.toISOString(),
        referralCode: generatedRefCode,
        updatedAt: serverTimestamp()
      };

      if (appliedCode) {
        updateData.appliedReferral = appliedCode;
      }

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // If user document doesn't exist yet, we must include required fields for the rule to pass
        await setDoc(docRef, {
          ...profile,
          ...updateData,
          userId: currentUser.uid,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(docRef, updateData);
      }
      
      setProfile(prev => prev ? {
        ...prev, 
        paymentStatus: 'paid',
        isSuspended: false,
        lastTrxId: trxId,
        expiryDate: expiryDate.toISOString(),
        referralCode: generatedRefCode,
        appliedReferral: appliedCode || prev.appliedReferral
      } : null);
      
      const originalPrice = 51;
      const finalPrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice;
      
      alert(`অভিনন্দন! আপনার ${finalPrice} টাকার ১ বছর মেয়াদী সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।`);
      setActiveTab('info');
    } catch (err) {
      console.error("Subscription error:", err);
      alert('পেমেন্ট সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setSubmittingTrx(false);
    }
  };

  const [downloadingSide, setDownloadingSide] = useState<string | null>(null);

  const downloadCard = async (side: 'front' | 'back', version: number = 1) => {
    const sideId = `${side}${version}`;
    if (downloadingSide) return;
    
    setDownloadingSide(sideId);

    const ref = version === 1 
      ? (side === 'front' ? cardFrontRef : cardBackRef)
      : version === 2
        ? (side === 'front' ? cardFrontRef2 : cardBackRef2)
        : (side === 'front' ? cardFrontRef3 : cardBackRef3);

    if (ref.current === null) {
      setDownloadingSide(null);
      return;
    }

    try {
      // Use pixelRatio: 2 for extremely sharp resolution (800x450 px), rendering 4x faster and with significantly less memory than pixelRatio: 4.
      // Disable cacheBust as it causes slow redundant stylesheet downloads.
      const dataUrl = await toPng(ref.current, { 
        cacheBust: false, 
        pixelRatio: 2, 
        backgroundColor: version === 3 ? '#000000' : '#022c22' 
      });
      const link = document.createElement('a');
      link.download = `card-v${version}-${side}-${profile?.name || 'user'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Card download failed:", err);
      alert('কার্ডটি ডাউনলোড করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setDownloadingSide(null);
    }
  };

  const logoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="25" fill="#064e3b"/>
      <path d="M30 40 L50 20 L70 40 M50 20 L50 80" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="15" fill="none" stroke="white" stroke-width="4" opacity="0.5"/>
    </svg>
  `;
  const logoData = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(logoSvg)))}`;

  const logout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-50/20">
        <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/20 font-sans selection:bg-emerald-100 min-w-fit sm:min-w-0">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <nav className="bg-white border-b border-emerald-100 sticky top-0 z-50 w-full min-w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-950 rounded-xl flex items-center justify-center text-white shadow-md border border-emerald-800/30">
                <ScanLine size={18} />
              </div>
              <div className="flex items-center">
                <span className="font-black tracking-tighter text-emerald-950 font-bengali text-xl">পরিচিতি</span>
              </div>
            </Link>
            <div className="h-4 w-px bg-emerald-50 mx-2 hidden sm:block"></div>
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all border border-emerald-200"
              >
                <ShieldCheck size={16} /> Admin List
              </Link>
            )}
            
            <div className="flex gap-1 bg-emerald-50/50 p-1 rounded-xl border border-emerald-100">
              {[
                { id: 'info', label: 'প্রাথমিক তথ্য' },
                { id: 'public', label: 'পাবলিক কার্ড' },
                { id: 'download', label: 'কার্ড ডাউনলোড' },
                { id: 'subscription', label: 'সাবস্ক্রিপশন' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-emerald-950 text-white shadow-lg' 
                      : 'text-emerald-900/60 hover:text-emerald-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 3-Dot Dropdown Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsThreeDotOpen(!isThreeDotOpen)} 
                className="text-emerald-950 hover:bg-emerald-50 p-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-emerald-100"
              >
                <MoreVertical size={18} />
              </button>
              {isThreeDotOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThreeDotOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 py-2">
                    <button
                      onClick={() => {
                        setActiveTab('referral');
                        setIsThreeDotOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold font-bengali text-gray-700 hover:bg-emerald-50 hover:text-emerald-805 transition-colors text-left"
                    >
                      <Gift size={15} className="text-emerald-600 animate-pulse" />
                      রেফার কোড
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={logout} className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors">
              <LogOut size={18} />
            </button>
          </div>

          <button className="md:hidden p-2 text-emerald-950" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-emerald-50 bg-white overflow-hidden shadow-xl"
            >
              <div className="p-6 space-y-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="w-full flex items-center justify-between p-4 bg-emerald-50 rounded-2xl text-emerald-700 border border-emerald-100 mb-2"
                  >
                    <span className="font-black text-[10px] uppercase tracking-widest">Admin Dashboard</span>
                    <ShieldCheck size={18} />
                  </Link>
                )}
                {[
                  { id: 'info', label: 'প্রাথমিক তথ্য' },
                  { id: 'public', label: 'পাবলিক কার্ড দেখুন' },
                  { id: 'download', label: 'কার্ড ডাউনলোড' },
                  { id: 'subscription', label: 'সাবস্ক্রিপশন' },
                  { id: 'referral', label: 'রেফার কোড' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-emerald-950 text-white shadow-xl' 
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="pt-4">
                  <button onClick={logout} className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-500">
                    <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 flex-grow">
        <AnimatePresence mode="wait">
          {/* SUSPENSION CHECK */}
          {isSuspended && activeTab !== 'subscription' ? (
            <motion.div 
              key="suspended"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl sm:rounded-[3rem] border-4 border-red-100 p-8 sm:p-16 text-center space-y-6 sm:space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border-4 border-white shadow-xl">
                <Ban size={48} />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-2xl sm:text-4xl font-black text-red-950 tracking-tighter">অ্যাকাউন্ট স্থগিত করা হয়েছে</h3>
                <p className="text-sm sm:text-gray-500 max-w-sm mx-auto leading-relaxed font-bold">দুঃখিত, আপনার সাবস্ক্রিপশন ফি জমা না দেওয়ায় অথবা মেয়াদ শেষ হওয়ায় অ্যাকাউন্টটি বর্তমানে স্থগিত (Suspended) আছে।</p>
                <div className="bg-red-50 p-3 sm:p-4 rounded-2xl text-red-900 text-[10px] sm:text-xs font-black uppercase tracking-widest inline-block border border-red-100">
                  Status: Action Required
                </div>
              </div>
              <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button 
                  onClick={() => setActiveTab('subscription')} 
                  className="bg-emerald-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
                >
                  পেমেন্ট করে সচল করুন
                </button>
                <button onClick={logout} className="bg-gray-100 text-gray-600 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-gray-200 transition-all">Logout</button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="main-content-container"
              className="w-full"
            >
              {activeTab === 'info' && (
                <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-emerald-50 bg-emerald-50/10 flex items-center justify-between">
                      <h2 className="font-bold flex items-center gap-2 text-emerald-950 uppercase tracking-widest text-[10px] sm:text-xs">
                        <User size={18} /> কার্ডের প্রাথমিক তথ্য
                      </h2>
                      {isPaid ? (
                        <span className="text-[9px] sm:text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 sm:px-3 py-1 rounded-full uppercase tracking-tighter">Pro</span>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-black bg-gray-100 text-gray-500 px-2 sm:px-3 py-1 rounded-full uppercase tracking-tighter">Free</span>
                      )}
                    </div>
                    
                    <form onSubmit={handleUpdate} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">কার্ডের নাম</label>
                            <input 
                              type="text"
                              className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-bold"
                              value={profile?.name || ''}
                              onChange={e => setProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">প্রোফাইল ফটো</label>
                            <div className="flex items-center gap-4">
                              <div className="relative group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 overflow-hidden flex items-center justify-center">
                                  {profile?.photoURL && !imageError ? (
                                    <img 
                                      src={profile.photoURL} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      loading="eager"
                                      crossOrigin="anonymous"
                                      onError={() => setImageError(true)}
                                    />
                                  ) : (
                                    <User className="text-emerald-200" size={32} />
                                  )}
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl"
                                >
                                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                </button>
                              </div>
                              <div className="flex-1 space-y-2">
                                 <input 
                                   type="file" 
                                   ref={fileInputRef}
                                   className="hidden" 
                                   accept="image/*"
                                   onChange={handleImageUpload}
                                 />
                                 <div className="relative">
                                   <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                   <input 
                                     type="url"
                                     className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl pl-12 pr-5 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-emerald-950 font-bold text-xs"
                                     placeholder="অথবা সরাসরি ফটোর লিঙ্ক দিন..."
                                     value={profile?.photoURL || ''}
                                     onChange={e => {
                                       setProfile(prev => prev ? {...prev, photoURL: e.target.value} : null);
                                       setImageError(false);
                                     }}
                                   />
                                   <p className="text-[9px] text-gray-400 mt-1 ml-1 leading-tight">* আপলোড ফেইল হলে ImgBB বা PostImages সাইটে ছবি আপলোড করে "Direct Link" এখানে দিন।</p>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">বায়ো / ভূমিকা</label>
                        <textarea 
                          className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all min-h-[120px] text-emerald-950 font-bold"
                          placeholder="নিজের সম্পর্কে কিছু বলুন..."
                          value={profile?.bio || ''}
                          onChange={e => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                        />
                      </div>

                      <div className="pt-6 border-t border-emerald-50">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2 uppercase tracking-widest">সোশ্যাল লিঙ্ক যুক্ত করুন</h3>
                        </div>
                        <div className="space-y-4">
                          {(profile?.socialLinks || []).map((link, idx) => {
                             const platforms = [
                               { key: 'facebook', icon: <FacebookIcon size={16} />, label: 'Facebook' },
                               { key: 'whatsapp', icon: <WhatsAppIcon size={16} />, label: 'WhatsApp' },
                               { key: 'instagram', icon: <InstagramIcon size={16} />, label: 'Instagram' },
                               { key: 'youtube', icon: <YouTubeIcon size={16} />, label: 'YouTube' },
                               { key: 'linkedin', icon: <LinkedInIcon size={16} />, label: 'LinkedIn' },
                               { key: 'tiktok', icon: <TikTokIcon size={16} />, label: 'TikTok' },
                               { key: 'x', icon: <XIcon size={16} />, label: 'X (Twitter)' },
                               { key: 'website', icon: <GlobeIcon size={16} />, label: 'Website' }
                             ];
                             const currentPlatform = platforms.find(p => p.key === link.platform) || platforms[0];

                             return (
                               <motion.div 
                                 key={`${link.platform}-${idx}`} 
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="flex flex-col sm:flex-row gap-3 items-end bg-emerald-50/20 p-4 rounded-2xl border border-emerald-50"
                               >
                                 <div className="w-full sm:w-40 space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">প্ল্যাটফর্ম</label>
                                    <select 
                                      className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600 transition-all appearance-none"
                                      value={link.platform}
                                      onChange={e => {
                                        const newLinks = [...(profile?.socialLinks || [])];
                                        newLinks[idx].platform = e.target.value;
                                        setProfile(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                                      }}
                                    >
                                      {platforms.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                                    </select>
                                 </div>
                                 <div className="flex-1 space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{currentPlatform.label} লিংক বা ইউজারনেম</label>
                                    <div className="relative">
                                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                                        {currentPlatform.icon}
                                      </div>
                                      <input 
                                        type="text"
                                        className="w-full bg-white border border-emerald-100 rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                                        placeholder={`${currentPlatform.label} তথ্য দিন...`}
                                        value={link.value}
                                        onChange={e => {
                                          const newLinks = [...(profile?.socialLinks || [])];
                                          newLinks[idx].value = e.target.value;
                                          setProfile(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                                        }}
                                      />
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                   <button 
                                     type="button"
                                     onClick={() => {
                                       const newLinks = [...(profile?.socialLinks || [])];
                                       newLinks.splice(idx + 1, 0, { platform: link.platform, value: '' });
                                       setProfile(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                                     }}
                                     className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md"
                                     title="একই ধরণের আরও একটি লিংক যোগ করুন"
                                   >
                                     <Plus size={18} />
                                   </button>
                                   <button 
                                     type="button"
                                     onClick={() => {
                                       const newLinks = (profile?.socialLinks || []).filter((_, i) => i !== idx);
                                       setProfile(prev => prev ? { ...prev, socialLinks: newLinks } : null);
                                     }}
                                     className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                                   >
                                     <Trash2 size={18} />
                                   </button>
                                 </div>
                               </motion.div>
                             );
                          })}
                          
                          {(profile?.socialLinks || []).length === 0 && (
                            <div className="text-center py-8 bg-emerald-50/20 rounded-3xl border border-dashed border-emerald-100">
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setProfile(prev => prev ? { ...prev, socialLinks: [{ platform: 'facebook', value: '' }] } : null);
                                 }}
                                 className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                               >
                                 <Plus size={16} /> সোশ্যাল লিংক যোগ করুন
                               </button>
                            </div>
                          )}

                          {(profile?.socialLinks || []).length > 0 && (
                            <div className="flex justify-center pt-2">
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setProfile(prev => prev ? { ...prev, socialLinks: [...(prev.socialLinks || []), { platform: 'facebook', value: '' }] } : null);
                                 }}
                                 className="text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all"
                               >
                                 <Plus size={16} /> নতুন প্ল্যাটফর্ম যোগ করুন
                               </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6">
                        <div className="flex gap-2">
                           {showSuccess && (
                             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1 text-green-600 text-xs font-bold">
                               <CheckCircle2 size={16} /> সফলভাবে সেভ করা হয়েছে
                             </motion.div>
                           )}
                           {error && <span className="text-red-500 text-xs font-bold">{error}</span>}
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          disabled={saving}
                          className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-600/20"
                        >
                          {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> তথ্য সেভ করুন</>}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'public' && (
                <motion.div key="public" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  {!isPaid ? (
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-emerald-100 p-6 sm:p-16 text-center space-y-6 sm:space-y-8 shadow-sm">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-4 border-white shadow-xl">
                        <Lock className="w-8 h-8 sm:w-12 sm:h-12" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-3xl font-black text-emerald-950 tracking-tight">পাবলিক কার্ড লক করা আছে</h3>
                        <p className="text-xs sm:text-base text-gray-500 max-w-sm mx-auto leading-relaxed font-bold">পাবলিক কার্ড শেয়ার করতে এবং নিজের প্রোফাইল অনলাইনে একটিভ করতে দয়া করে সাবস্ক্রিপশন সম্পন্ন করুন।</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('subscription')}
                        className="bg-emerald-950 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-2xl shadow-emerald-950/20 active:scale-95"
                      >
                        সাবস্ক্রাইব করুন
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-emerald-100 overflow-hidden shadow-sm p-6 sm:p-10 flex flex-col items-center text-center space-y-8 sm:space-y-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl border border-emerald-100">
                        <ScanLine className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">আপনার ডিজিটাল প্রোফাইল</h2>
                        <p className="text-sm sm:text-base text-gray-500">আপনার কার্ডের কিউআর কোড নিচে দেওয়া হলো। এটি স্ক্যান করে যে কেউ আপনার প্রোফাইলে পৌঁছাতে পারবে।</p>
                      </div>
                      <div className="p-4 sm:p-8 bg-emerald-50/50 rounded-[2rem] sm:rounded-[3rem] border border-emerald-100 shadow-inner group transition-all">
                        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl group-hover:scale-105 transition-transform duration-500">
                          <QRCodeSVG 
                            value={publicUrl}
                            size={window.innerWidth < 640 ? 180 : 220}
                            level="H"
                            imageSettings={{ src: logoData, height: 48, width: 48, excavate: true }}
                            fgColor="url(#qr-gradient)"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 mb-4">
                        <p className="text-emerald-800/60 font-bold flex items-center justify-center gap-2">
                           <Eye size={16} /> {profile?.views || 0} জন আপনার কার্ডটি দেখেছে
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-lg">
                        <Link to={`/u/${currentUser?.uid}`} className="flex-1 min-w-[130px] sm:min-w-[200px] bg-emerald-950 text-white px-4 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[11px] flex items-center justify-center gap-2 sm:gap-3 hover:bg-black transition-all shadow-xl shadow-emerald-950/20">
                          কার্ড দেখুন <ExternalLink size={16} />
                        </Link>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(publicUrl);
                            alert('Link copied!');
                          }}
                          className="flex-1 min-w-[130px] sm:min-w-[200px] bg-emerald-50 text-emerald-950 border border-emerald-100 px-4 sm:px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[11px] flex items-center justify-center gap-2 sm:gap-3 hover:bg-emerald-100 transition-all"
                        >
                          লিঙ্ক কপি করুন <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'download' && (
                <motion.div key="download" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  {!isPaid ? (
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-emerald-100 p-6 sm:p-16 text-center space-y-6 sm:space-y-8 shadow-sm">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xl border-4 border-white">
                        <Lock className="w-8 h-8 sm:w-12 sm:h-12" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-3xl font-black text-emerald-950 tracking-tight">ডাউনলোড অপশন লক করা আছে</h3>
                        <p className="text-xs sm:text-base text-gray-500 max-w-sm mx-auto leading-relaxed font-bold">কার্ডের সামনের এবং পিছনের ছবি ডাউনলোড করতে দয়া করে সাবস্ক্রিপশন সম্পন্ন করুন।</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('subscription')}
                        className="bg-emerald-950 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-2xl active:scale-95"
                      >
                        সাবস্ক্রাইব করুন
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {/* Design Version 1 */}
                      <div className="bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-sm">
                        <div className="p-4 sm:p-6 border-b border-emerald-50 bg-emerald-50/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2 order-2 sm:order-1">
                             <button 
                               onClick={() => downloadCard('front', 1)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 bg-emerald-950 text-white rounded-lg text-[9px] font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'front1' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Front <Download size={12} /></>
                               )}
                             </button>
                             <button 
                               onClick={() => downloadCard('back', 1)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 border border-emerald-100 text-emerald-950 rounded-lg text-[9px] font-bold hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'back1' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Back <Download size={12} /></>
                               )}
                             </button>
                          </div>
                          <h2 className="font-black flex items-center gap-3 text-emerald-950 uppercase tracking-widest text-[10px] sm:text-xs order-1 sm:order-2">
                            <CreditCard size={18} className="text-emerald-600" /> কার্ড ডিজাইন ১ (Classic)
                          </h2>
                        </div>
                        <div className="p-2 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center overflow-hidden">
                          {/* Front V1 */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Front Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-xl p-1 overflow-hidden w-full max-w-[400px]">
                              <div className="flex-shrink-0 transform scale-[0.45] sm:scale-[0.8] lg:scale-100 origin-center my-[-55px] sm:my-[-15px] lg:my-0">
                                <div ref={cardFrontRef} className="w-[400px] h-[225px] rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-between px-10" style={{ background: 'linear-gradient(135deg, #022c22 0%, #000000 100%)' }}>
                                  <div className="absolute top-0 right-0 w-[70%] h-full bg-emerald-900/20 blur-[100px] rounded-full -mr-32"></div>
                                  <div className="relative z-10 flex flex-col justify-center gap-6">
                                     <div className="flex flex-col opacity-80">
                                       <h2 className="text-white text-3xl font-black tracking-tighter font-bengali">পরিচিতি</h2>
                                     </div>
                                     <div className="border-l-4 border-emerald-500/40 pl-4 py-1">
                                       <h3 className="text-white text-xl font-black tracking-tight font-bengali">{profile?.name}</h3>
                                       <p className="text-emerald-400/60 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">Digital Identity Card</p>
                                     </div>
                                  </div>
                                  <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-xl ring-4 ring-emerald-950/20">
                                      <QRCodeSVG value={publicUrl} size={80} level="H" imageSettings={{ src: logoData, height: 20, width: 20, excavate: true }} fgColor="#022c22" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Back V1 */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Back Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-xl p-1 overflow-hidden w-full max-w-[400px]">
                              <div className="flex-shrink-0 transform scale-[0.45] sm:scale-[0.8] lg:scale-100 origin-center my-[-55px] sm:my-[-15px] lg:my-0">
                                <div ref={cardBackRef} className="w-[400px] h-[225px] rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-center px-10" style={{ background: 'linear-gradient(135deg, #000000 0%, #022c22 100%)' }}>
                                   <div className="relative z-10 text-center space-y-6">
                                     <h2 className="text-white text-3xl font-black tracking-tight leading-loose font-bengali">চলুন নতুন ভাবে<br />পরিচিত হই</h2>
                                     <div className="flex flex-col items-center gap-2">
                                       <div className="w-12 h-0.5 bg-emerald-500 rounded-full opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                       <span className="text-[7px] text-emerald-500/50 font-black uppercase tracking-[0.8em]">Porichiti Digital</span>
                                     </div>
                                   </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Design Version 2 */}
                      <div className="bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-sm">
                        <div className="p-5 sm:p-8 border-b border-emerald-50 bg-emerald-50/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex gap-2 order-2 sm:order-1">
                             <button 
                               onClick={() => downloadCard('front', 2)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 bg-emerald-950 text-white rounded-lg text-[9px] font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'front2' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Front <Download size={12} /></>
                               )}
                             </button>
                             <button 
                               onClick={() => downloadCard('back', 2)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 border border-emerald-100 text-emerald-950 rounded-lg text-[9px] font-bold hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'back2' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Back <Download size={12} /></>
                               )}
                             </button>
                          </div>
                          <h2 className="font-black flex items-center gap-3 text-emerald-950 uppercase tracking-widest text-[10px] sm:text-xs order-1 sm:order-2">
                            <CreditCard size={18} className="text-emerald-600" /> কার্ড ডিজাইন ২ (Photo Edition)
                          </h2>
                        </div>
                        <div className="p-2 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center overflow-hidden">
                          {/* Front V2: Photo on front instead of QR */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Front Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-xl p-1 overflow-hidden w-full max-w-[400px]">
                              <div className="flex-shrink-0 transform scale-[0.45] sm:scale-[0.8] lg:scale-100 origin-center my-[-55px] sm:my-[-15px] lg:my-0">
                                <div ref={cardFrontRef2} className="w-[400px] h-[225px] rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-between px-10" style={{ background: 'linear-gradient(135deg, #022c22 0%, #000000 100%)' }}>
                                  <div className="absolute top-0 right-0 w-[70%] h-full bg-emerald-900/20 blur-[100px] rounded-full -mr-32"></div>
                                  <div className="relative z-10 flex flex-col justify-center gap-6">
                                     <div className="flex flex-col opacity-80">
                                       <h2 className="text-white text-3xl font-black tracking-tighter font-bengali">পরিচিতি</h2>
                                     </div>
                                     <div className="border-l-4 border-emerald-500/40 pl-4 py-1">
                                       <h3 className="text-white text-xl font-black tracking-tight font-bengali">{profile?.name}</h3>
                                       <p className="text-emerald-400/60 text-[8px] font-bold uppercase tracking-[0.3em] mt-1">Digital Identity Card</p>
                                     </div>
                                  </div>
                                  <div className="relative z-10">
                                    <div className="w-32 h-32 rounded-3xl bg-emerald-950 border-4 border-white/20 overflow-hidden shadow-2xl relative aspect-square">
                                      {profile?.photoURL ? (
                                        <img 
                                          src={profile.photoURL} 
                                          alt="" 
                                          className="w-full h-full object-cover" 
                                          style={{ objectPosition: 'center' }}
                                          crossOrigin="anonymous"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-emerald-900">
                                          <User className="text-emerald-700" size={48} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Back V2: Text and QR on left */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Back Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-xl p-1 overflow-hidden w-full max-w-[400px]">
                              <div className="flex-shrink-0 transform scale-[0.45] sm:scale-[0.8] lg:scale-100 origin-center my-[-55px] sm:my-[-15px] lg:my-0">
                                <div ref={cardBackRef2} className="w-[400px] h-[225px] rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-between px-10 gap-4" style={{ background: 'linear-gradient(135deg, #000000 0%, #022c22 100%)' }}>
                                   <div className="relative z-10 text-left space-y-3">
                                     <div className="w-10 h-1 bg-emerald-500 rounded-full mb-1"></div>
                                     <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.4em]">Connect with me</span>
                                     <h2 className="text-white text-2xl font-black tracking-tight leading-loose font-bengali">চলুন নতুন ভাবে<br />পরিচিত হই</h2>
                                   </div>
                                   <div className="relative z-10 flex flex-col items-center gap-3">
                                     <div className="bg-white p-2.5 rounded-2xl shadow-2xl ring-4 ring-white/5">
                                        <QRCodeSVG value={publicUrl} size={70} level="H" imageSettings={{ src: logoData, height: 16, width: 16, excavate: true }} fgColor="#022c22" />
                                     </div>
                                     <span className="text-[6px] text-emerald-500 font-black uppercase tracking-[0.5em]">Scan To Connect</span>
                                   </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Design Version 3 */}
                      <div className="bg-white rounded-[2.5rem] border border-emerald-100 overflow-hidden shadow-sm">
                        <div className="p-5 sm:p-8 border-b border-emerald-50 bg-emerald-50/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex gap-2 order-2 sm:order-1">
                             <button 
                               onClick={() => downloadCard('front', 3)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 bg-emerald-950 text-white rounded-lg text-[9px] font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'front3' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Front <Download size={12} /></>
                               )}
                             </button>
                             <button 
                               onClick={() => downloadCard('back', 3)} 
                               disabled={downloadingSide !== null}
                               className="flex items-center gap-2 px-3 py-2 border border-emerald-100 text-emerald-950 rounded-lg text-[9px] font-bold hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               {downloadingSide === 'back3' ? (
                                 <>অপেক্ষা করুন... <Loader2 size={12} className="animate-spin" /></>
                               ) : (
                                 <>Back <Download size={12} /></>
                               )}
                             </button>
                          </div>
                          <h2 className="font-black flex items-center gap-3 text-emerald-950 uppercase tracking-widest text-[10px] sm:text-xs order-1 sm:order-2">
                            <CreditCard size={18} className="text-emerald-600" /> কার্ড ডিজাইন ৩ (Portrait Edition)
                          </h2>
                        </div>
                        <div className="p-2 sm:p-6 flex flex-col md:flex-row gap-6 md:gap-12 justify-center items-center overflow-hidden">
                          {/* Front V3: Portrait full vertical image on front */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Front Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-2xl p-4 w-[270px] h-[380px] items-center border border-emerald-50 shadow-inner">
                              <div ref={cardFrontRef3} className="w-[240px] h-[350px] rounded-2xl relative overflow-hidden shadow-xl flex items-center justify-center bg-black">
                                {profile?.photoURL ? (
                                  <img 
                                    src={profile.photoURL} 
                                    alt="" 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                    style={{ objectPosition: 'center' }}
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-black select-none">
                                    <User className="text-neutral-700" size={64} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-2 font-bengali">ছবি আপলোড করুন</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Back V3: Vertical card, black background */}
                          <div className="space-y-2 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Back Preview</span>
                            <div className="flex justify-center bg-gray-50 rounded-2xl p-4 w-[270px] h-[380px] items-center border border-emerald-50 shadow-inner">
                              <div ref={cardBackRef3} className="w-[240px] h-[350px] rounded-2xl relative overflow-hidden shadow-xl flex flex-col justify-between py-8 px-6" style={{ background: '#000000' }}>
                                 <div className="relative z-10 text-center space-y-1.5 flex flex-col items-center">
                                   <div className="w-12 h-1 bg-emerald-500 rounded-full mb-1"></div>
                                   <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.4em] block">Connect with me</span>
                                   <h2 className="text-white text-base font-black tracking-tight leading-relaxed font-bengali pt-1">চলুন নতুন ভাবে<br />পরিচিত হই</h2>
                                 </div>
                                 <div className="relative z-10 flex flex-col items-center gap-2">
                                   <div className="bg-white p-2.5 rounded-2xl shadow-2xl ring-4 ring-white/5">
                                      <QRCodeSVG value={publicUrl} size={80} level="H" imageSettings={{ src: logoData, height: 16, width: 16, excavate: true }} fgColor="#022c22" />
                                   </div>
                                   <span className="text-[6px] text-emerald-500 font-black uppercase tracking-[0.5em] mt-1">Scan To Connect</span>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'subscription' && (
                <motion.div key="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 sm:space-y-8">
                   <div className="bg-emerald-950 rounded-2xl sm:rounded-[3rem] p-4 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-emerald-900">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full -mr-64 -mt-64"></div>
                      <div className="relative z-10 space-y-6 sm:space-y-12">
                        <div className="flex items-center gap-3 sm:gap-5">
                           <div className="w-10 h-10 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-lg sm:rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-inner">
                              <CreditCard className="text-emerald-400" size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg sm:text-3xl font-black tracking-tighter">প্রো সাবস্ক্রিপশন</h3>
                              <p className="text-emerald-400/60 text-[8px] sm:text-[11px] font-black uppercase tracking-[0.3em] mt-0.5 sm:mt-1">Activate Full Features</p>
                           </div>
                        </div>
                        <div className="p-4 sm:p-8 bg-white/5 rounded-xl sm:rounded-[2.5rem] border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center sm:justify-between gap-4 shadow-2xl text-center sm:text-left">
                           <div className="space-y-1">
                              <span className="text-[8px] sm:text-[11px] font-black uppercase text-emerald-400 tracking-widest">১ বছর মেয়াদের জন্য</span>
                              <div className="flex flex-col">
                                 {discountPercent > 0 && (
                                   <span className="text-xs sm:text-sm text-rose-400 line-through font-bold text-center sm:text-left">৳ ৫১ মাত্র</span>
                                 )}
                                 <div className="flex items-baseline justify-center sm:justify-start gap-2">
                                    <span className="text-3xl sm:text-6xl font-black">
                                       ৳ {discountPercent > 0 ? Math.round(51 * (1 - discountPercent / 100)) : 51}
                                    </span>
                                    <span className="text-lg sm:text-2xl text-emerald-400/40 font-bold">মাত্র</span>
                                 </div>
                              </div>
                           </div>
                           <div className="bg-emerald-500 text-emerald-950 font-black px-3 py-1 sm:px-5 sm:py-2 rounded-full text-[8px] sm:text-[10px] uppercase shadow-lg shadow-emerald-500/20">Special Offer</div>
                        </div>

                        {/* Referral Code Application */}
                        {!isPaid && (
                           <div className="bg-white/5 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-white/10 backdrop-blur-xl">
                              <div className="flex items-center gap-2 mb-3">
                                 <Tag size={14} className="text-emerald-400 animate-pulse" />
                                 <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-300 tracking-wider font-bengali">রেফার কোড ব্যবহার করুন</span>
                              </div>

                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    placeholder="যেমন: SPECIAL30 বা বন্ধুর কোড"
                                    disabled={!!appliedCode}
                                    className="flex-grow px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider "
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value)}
                                 />
                                 <button
                                    type="button"
                                    onClick={() => checkAndApplyCode()}
                                    disabled={checkingCode || !!appliedCode}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                                 >
                                    {checkingCode ? <Loader2 size={12} className="animate-spin" /> : (appliedCode ? 'প্রযুক্ত' : 'প্রয়োগ করুন')}
                                 </button>
                              </div>

                              {codeError && <p className="text-[10px] sm:text-xs text-rose-300 font-bold mt-2 flex items-center gap-1">⚠ {codeError}</p>}
                              {codeSuccess && <p className="text-[10px] sm:text-xs text-emerald-200 font-bold mt-2 flex items-center gap-1">✓ {codeSuccess}</p>}
                           </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                           <div className="p-4 sm:p-6 bg-pink-600/90 rounded-xl sm:rounded-3xl border border-white/10 shadow-xl space-y-2 sm:space-y-3">
                              <div className="flex items-center justify-between">
                                 <span className="text-[8px] sm:text-[10px] font-black uppercase text-pink-200">বিকাশ (Personal)</span>
                                 <div className="w-5 h-5 bg-white/20 rounded-md"></div>
                              </div>
                              <p className="text-lg sm:text-2xl font-black tracking-widest break-all">01303862214</p>
                           </div>
                           <div className="p-4 sm:p-6 bg-orange-600/90 rounded-xl sm:rounded-3xl border border-white/10 shadow-xl space-y-2 sm:space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] sm:text-[10px] font-black uppercase text-orange-200">নগদ (Personal)</span>
                                <div className="w-5 h-5 bg-white/20 rounded-md"></div>
                              </div>
                              <p className="text-lg sm:text-2xl font-black tracking-widest break-all">01303862214</p>
                           </div>
                        </div>
                        
                        {!isPaid ? (
                          <>
                            <div className="bg-white/5 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-white/10 text-[10px] sm:text-xs text-emerald-100/60 leading-relaxed italic">
                              উপরে দেওয়া যেকোনো একটি নম্বরে <span className="text-white font-black">{discountPercent > 0 ? Math.round(51 * (1 - discountPercent / 100)) : 51} টাকা</span> "Send Money" করুন। এরপর নিচের ফর্মে আপনার পেমেন্ট তথ্য দিন। সাবমিট করলে আপনার অ্যাকাউন্ট অটোমেটিক ১ বছরের জন্য প্রো হয়ে যাবে।
                            </div>
                            <form onSubmit={handleUpgradeRequest} className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 space-y-5 sm:space-y-8 text-emerald-950 shadow-2xl">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                  <div className="space-y-1.5">
                                    <label className="text-[8px] sm:text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">আপনার বিকাশ/নগদ নম্বর</label>
                                    <input 
                                      type="text" 
                                      required
                                      value={senderNumber}
                                      onChange={(e) => setSenderNumber(e.target.value)}
                                      placeholder="০১৭... নম্বরটি দিন"
                                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl text-sm font-black focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[8px] sm:text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">Transaction ID (TrxID)</label>
                                     <input 
                                       type="text" 
                                       required
                                       value={trxId}
                                       onChange={(e) => setTrxId(e.target.value)}
                                       placeholder="TrxID দিন"
                                       className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl text-sm font-black focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all uppercase"
                                     />
                                  </div>
                               </div>
                               <button 
                                 type="submit"
                                 disabled={submittingTrx}
                                 className="w-full bg-emerald-950 text-white font-black uppercase tracking-widest text-[9px] sm:text-[11px] py-4 sm:py-6 rounded-xl sm:rounded-2xl hover:bg-black transition-all shadow-2xl shadow-emerald-950/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                               >
                                 {submittingTrx ? <><Loader2 className="animate-spin" size={18} /> সাবমিট হচ্ছে...</> : 'সাবস্ক্রাইব করুন এবং একটিভ করুন'}
                               </button>
                            </form>
                          </>
                        ) : (
                          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 text-center space-y-4 sm:space-y-6 text-emerald-950">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-2 border-emerald-100 shadow-xl">
                               <CheckCircle2 size={30} />
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-lg sm:text-2xl font-black tracking-tight">আপনার সাবস্ক্রিপশন সচল আছে</h4>
                               <p className="text-gray-500 text-[10px] sm:text-sm font-bold">পরবর্তী রিনিউয়াল ডেট নিচে দেওয়া হলো। এই তারিখের পর আবার পেমেন্ট করার অপশন আসবে।</p>
                            </div>
                            <div className="bg-emerald-50 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-emerald-100 inline-block">
                               <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-800/60 mb-0.5">Renewal Date</p>
                               <p className="text-lg sm:text-2xl font-black text-emerald-900">
                                 {profile?.expiryDate ? new Date(profile.expiryDate).toLocaleDateString('bn-BD', {
                                   year: 'numeric',
                                   month: 'long',
                                   day: 'numeric'
                                 }) : 'মেয়াদ পাওয়া যায়নি'}
                               </p>
                            </div>

                            {/* Personal Referral share section */}
                            <div className="mt-8 pt-6 border-t border-gray-100 text-left space-y-4 font-bengali">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl mt-0.5 shrink-0">
                                  <Gift size={20} className="text-emerald-700" />
                                </div>
                                <div className="space-y-1">
                                  <h5 className="font-extrabold text-gray-900 text-sm">পরিচিতি রেফারেল প্রোগ্রাম</h5>
                                  <p className="text-xs text-gray-500 leading-relaxed font-bengali">
                                    মেসেঞ্জারে বন্ধুদের শেয়ার করে আপনার অনন্য রেফারেল কোডটি আনলক করুন এবং আকর্ষণীয় পুরষ্কার অর্জন করুন! 
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('referral')}
                                      className="inline-flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 text-white transition-colors px-4 py-2 rounded-xl text-xs font-bold cursor-pointer select-none"
                                    >
                                      রেফারেল পোর্টালে যান
                                      <ArrowLeft size={14} className="rotate-180" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'referral' && (
                <motion.div
                  key="ref-portal"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden font-sans text-left max-w-2xl mx-auto"
                >
                  <div className="bg-emerald-950 p-6 sm:p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10 animate-pulse">
                      <Gift size={120} className="fill-white text-white" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-sans">
                        Referral Portal
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-bengali">পরিচিতি রেফারেল প্রোগ্রাম</h3>
                      <p className="text-xs text-emerald-200/80 leading-relaxed font-bengali">
                        মেসেঞ্জারে বন্ধুদের সাথে শেয়ার করুন এবং পেয়ে যান বিশেষ ডিস্কাউন্ট বা পুরষ্কার!
                      </p>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 space-y-8">
                    {/* 1. Video Guideline player if provided by Admin */}
                    {videoUrl && (
                      <div className="space-y-4">
                        <h4 className="font-extrabold text-gray-900 text-sm font-bengali flex items-center gap-2">
                          <Video size={18} className="text-emerald-700 font-bold" />
                          রেফারেল গাইডলাইন ভিডিও
                        </h4>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                          {(() => {
                            const getYouTubeEmbedId = (url: string) => {
                              if (!url) return null;
                              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                              const match = url.match(regExp);
                              return (match && match[2].length === 11) ? match[2] : null;
                            };
                            const embedId = getYouTubeEmbedId(videoUrl);
                            if (embedId) {
                              return (
                                <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${embedId}`}
                                    title="Referral Guideline Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  ></iframe>
                                </div>
                              );
                            } else {
                              return (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
                                  <p className="text-xs text-gray-500 font-bengali leading-relaxed md:max-w-md">
                                    রেফারেল প্রোগ্রামের নিয়ম এবং সহজে অতিরিক্ত আয়ের সেরা ট্রিকস জানতে নিচের লিংকে ক্লিক করে আমাদের নির্দেশিকা ভিডিওটি দেখে নিন।
                                  </p>
                                  <a
                                    href={videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-emerald-950 text-white text-xs font-black py-3 px-5 rounded-xl hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shrink-0 inline-flex"
                                  >
                                    <Video size={14} />
                                    ভিডিওটি দেখুন
                                  </a>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* 2. Messenger Share Counter & Progress */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                          <Gift size={20} className="text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-900 text-sm font-bengali">মেসেঞ্জারে ৩ জন বন্ধুকে শেয়ার করুন</h4>
                          <p className="text-[11px] text-gray-500 font-bengali leading-relaxed">
                            মেসেঞ্জারে ৩ জন ফ্রেন্ডকে শেয়ার করলেই আপনার নিজস্ব বিশেষ রেফারেল কোড এবং শেয়ার লিংক স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে!
                          </p>
                        </div>
                      </div>

                      {/* Share Tracking Box */}
                      <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-200 text-left space-y-6">
                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center font-bengali">
                            <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-400">মেসেঞ্জার শেয়ার অগ্রগতি</span>
                            <span className="text-emerald-700 font-black text-xs">
                              {profile?.messengerShares || 0} / ৩ সম্পন্ন হয়েছে
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, ((profile?.messengerShares || 0) / 3) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Lock / Reward Indicator & Share CTA */}
                        {(() => {
                          const shares = profile?.messengerShares || 0;
                          const hasUnlocked = shares >= 3;
                          const generatedCode = profile?.referralCode || `REF-${currentUser?.uid.substring(0, 8).toUpperCase()}`;
                          const referralLink = `${window.location.origin}/dashboard?ref=${generatedCode}`;

                          if (!hasUnlocked) {
                            return (
                              <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/50 text-xs font-bold leading-relaxed font-bengali">
                                  📌 শেয়ার সম্পন্ন হলে আপনার পুরষ্কার: <span className="text-emerald-700 font-black text-sm">{rewardAmount || '৩০% ডিস্কাউন্ট ও নগদ পুরষ্কার'}</span> পাবেন।
                                </div>
                                <div className="text-center">
                                  <button
                                    type="button"
                                    onClick={handleMessengerShare}
                                    className="bg-[#00B2FF] hover:bg-[#0099DD] text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 max-w-xs mx-auto cursor-pointer"
                                  >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                      <path d="M12 2C6.36 2 2 6.13 2 11.2c0 2.9 1.44 5.48 3.7 7.15V22l3.47-1.9c.87.24 1.8.38 2.83.38 5.64 0 10-4.13 10-9.2C22 6.13 17.64 2 12 2zm1.18 12.06L10.3 11l-3.57 3.56 3.92-4.18 2.87 3.06 3.52-3.56-3.85 4.18z"/>
                                    </svg>
                                    <span>মেসেঞ্জারে বন্ধুকে শেয়ার করুন</span>
                                  </button>
                                  <p className="text-[10px] text-gray-400 mt-2 font-bengali">
                                    *প্রতিটি শেয়ার কাউন্ট করতে বাটনে ক্লিক করে মেসেঞ্জার চ্যাট চালু করুন। ৩ বার শেয়ার করা হলে কোড তৈরি হবে।
                                  </p>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-5 pt-2">
                                <div className="p-4 bg-emerald-100/50 text-emerald-950 rounded-xl border border-emerald-200/50 text-xs font-bold leading-relaxed font-bengali flex items-center gap-2">
                                  <span className="text-lg">🎉</span>
                                  <span>অভিনন্দন! মেসেঞ্জারে ৩ জন বন্ধুকে শেয়ার সফল হয়েছে। নিচে আপনার অনন্য কোডটি দেওয়া হলো:</span>
                                </div>

                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/50 text-xs font-bold leading-relaxed font-bengali">
                                  📌 রেফারেল মেম্বারশিপ থেকে আপনার পুরষ্কারের পরিমাণ: <span className="text-emerald-700 font-extrabold text-sm">{rewardAmount || '৩০% ডিস্কাউন্ট ও নগদ পুরষ্কার'}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Unlocked Referral Code Display */}
                                  <div className="space-y-1 text-left">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 font-bengali font-sans font-bold">আপনার অনন্য রেফার কোড</span>
                                    <div className="flex items-center justify-between gap-1.5 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-100 shadow-sm">
                                      <span className="font-mono font-black text-emerald-900 text-xs tracking-wider">
                                        {generatedCode}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(generatedCode);
                                            alert('আপনার রেফারেল কোড সফলভাবে কপি করা হয়েছে!');
                                          } catch (err) {
                                            alert('কোড কপি করতে সমস্যা হয়েছে।');
                                          }
                                        }}
                                        className="bg-emerald-950 hover:bg-emerald-900 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                                      >
                                        <Copy size={10} />
                                        <span>কপি করুন</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Unlocked Referral Link Display */}
                                  <div className="space-y-1 text-left">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 font-bengali font-sans font-bold">আপনার শেয়ার করার লিংক</span>
                                    <div className="flex items-center justify-between gap-1.5 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-100 shadow-sm">
                                      <span className="font-mono text-[9px] text-emerald-900 overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                                        {referralLink}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(referralLink);
                                            alert('আপনার রেফারেল লিংক সফলভাবে কপি করা হয়েছে!');
                                          } catch (err) {
                                            alert('লিংক কপি করতে সমস্যা হয়েছে।');
                                          }
                                        }}
                                        className="bg-emerald-950 hover:bg-emerald-900 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                                      >
                                        <Copy size={10} />
                                        <span>কপি করুন</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
