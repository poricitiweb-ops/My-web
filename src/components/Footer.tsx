import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-emerald-950 text-white py-12 px-6 mt-auto shrink-0 min-w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={24} />
            <span className="text-xl font-black uppercase tracking-widest italic">Digital Identity</span>
          </div>
          <p className="text-emerald-200/60 text-sm font-medium text-center md:text-left max-w-xs">
            আপনার ডিজিটাল পরিচিতি আরও স্মার্ট করুন। সহজে শেয়ার করুন আপনার পেমেন্ট এবং সোশ্যাল লিঙ্ক।
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400">যোগাযোগ করুন</h4>
          <a 
            href="mailto:poriciti.web@gmail.com" 
            className="flex items-center gap-2 hover:text-emerald-400 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <Mail size={18} />
            </div>
            <span className="font-bold">poriciti.web@gmail.com</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.2em]">
        <p>© 2024 DIGITAL IDENTITY. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
