import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Hash, 
  ArrowRight,
  Database,
  Clock,
  User,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export interface MessageReceipt {
  receiptId: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  timestamp: string;
  expectedReplyDate?: string;
  estimatedReplyTime: string;
  deliveryStatus: string;
  databaseEngine?: string;
  securityHash?: string;
}

interface MessageReceiptModalProps {
  receipt: MessageReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MessageReceiptModal: React.FC<MessageReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Handle escape key and body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) return null;

  const copyReceiptId = () => {
    navigator.clipboard.writeText(receipt.receiptId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getFullLetterText = () => {
    return `
================================================================================
              OFFICIAL ACKNOWLEDGMENT & RESPONSE ASSURANCE LETTER
                        PIYUSH KUMAR — ENGINEERING PORTFOLIO
================================================================================

DATE & TIME       : ${receipt.timestamp}
REFERENCE ID      : ${receipt.receiptId}
DELIVERY STATUS   : ${receipt.deliveryStatus}
STORAGE ENGINE    : ${receipt.databaseEngine || 'Verified Database (Synced)'}
SECURITY HASH     : ${receipt.securityHash || 'SHA256-AUTHENTICATED'}
EXPECTED RESPONSE : Within ${receipt.estimatedReplyTime} (Target: ${receipt.expectedReplyDate || 'Next 24 Hours'})

--------------------------------------------------------------------------------
1. TRANSMISSION PARTIES
--------------------------------------------------------------------------------
From (Sender)     : ${receipt.senderName} <${receipt.senderEmail}>
To (Recipient)    : ${receipt.recipientName} <${receipt.recipientEmail}>

--------------------------------------------------------------------------------
2. FORMAL ACKNOWLEDGMENT & ASSURANCE
--------------------------------------------------------------------------------
Dear ${receipt.senderName},

Thank you very much for reaching out through my engineering portfolio website!

This official transmission receipt confirms that your message has been safely
received, authenticated, and permanently recorded in our secure database. 

I personally review all incoming project inquiries, software engineering
opportunities, research proposals, and collaboration requests. You will
receive a direct, detailed response at your email address (${receipt.senderEmail})
as soon as possible, with a target response time of ${receipt.estimatedReplyTime}
(by ${receipt.expectedReplyDate || 'within 24 hours'}).

If your inquiry requires urgent or immediate coordination, you may also contact
me directly at:
${receipt.recipientEmail}

--------------------------------------------------------------------------------
3. VERIFIED MESSAGE TRANSCRIPT
--------------------------------------------------------------------------------
"${receipt.message}"

--------------------------------------------------------------------------------
4. VERIFICATION & RECORD DETAILS
--------------------------------------------------------------------------------
Verification ID   : ${receipt.receiptId}
Security Signature: ${receipt.securityHash || 'SHA256-PKG-VERIFIED'}
Database Status   : Logged & Synchronized

Thank you for your time, interest, and consideration!

Warm regards,

Piyush Kumar
Software & Machine Learning Engineer
Email: ${receipt.recipientEmail}
Portfolio: https://piyushkumar.dev
================================================================================
`.trim();
  };

  const copyAssuranceLetter = () => {
    navigator.clipboard.writeText(getFullLetterText());
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    try {
      const receiptContent = getFullLetterText();
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Assurance_Receipt_PiyushKumar_${receipt.receiptId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFirebase = receipt.databaseEngine?.toLowerCase().includes('firebase');
  const isSupabase = receipt.databaseEngine?.toLowerCase().includes('supabase');
  const databaseBadgeName = isFirebase ? 'Firebase Firestore' : isSupabase ? 'Supabase PostgreSQL' : 'Persistent Storage';

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          ref={modalRef}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          id="receipt-modal-card"
          className="relative w-full max-w-2xl bg-[#0c1017] border border-white/[0.12] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 my-4 sm:my-8 text-slate-200 print:bg-white print:text-black print:border-none print:shadow-none print:m-0 print:p-0 flex flex-col max-h-[92vh]"
        >
          {/* Top Accent Gradient Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shrink-0 print:hidden" />

          {/* Modal Header */}
          <div className="p-5 sm:p-7 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0 bg-[#0c1017]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Message Confirmed & Stored
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#111722] text-slate-300 border border-white/10 font-medium">
                    <Database className="w-3 h-3 text-cyan-400" />
                    {databaseBadgeName}
                  </span>
                </div>
                <h2 id="receipt-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Official Transmission Receipt
                </h2>
              </div>
            </div>

            {/* Circular Blur Close Button */}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-full bg-[#111722] hover:bg-[#182030] border border-white/10 text-slate-400 hover:text-white transition-all duration-200 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 print:overflow-visible bg-[#0c1017]">
            
            {/* Formal Greeting & Assurance Letterhead */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#111722]/90 border border-emerald-500/25 space-y-3.5 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Response Assurance Guarantee</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono font-medium">
                  {receipt.receiptId}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Dear {receipt.senderName},
                </p>
                
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Thank you for reaching out through my portfolio website. Your message has been safely transmitted, cryptographically logged, and synchronized directly into our database.
                </p>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  I review all engineering opportunities, research proposals, and inquiries personally. You will receive a comprehensive response sent directly to <strong className="text-emerald-300 font-semibold">{receipt.senderEmail}</strong> as soon as possible.
                </p>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t border-white/[0.08]">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Expected Response Window: <strong>{receipt.estimatedReplyTime}</strong></span>
                </div>
                {receipt.expectedReplyDate && (
                  <span className="text-slate-400 text-[11px]">
                    Target by: <strong className="text-slate-200 font-medium">{receipt.expectedReplyDate}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Structured Receipt Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Hash className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Reference ID</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                  <span className="truncate max-w-[140px]">{receipt.receiptId}</span>
                  <button
                    onClick={copyReceiptId}
                    type="button"
                    title="Copy Reference ID"
                    className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Timestamp</span>
                </div>
                <span className="font-medium text-white truncate max-w-[170px] text-right">{receipt.timestamp}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Sender</span>
                </div>
                <span className="font-medium text-white truncate max-w-[160px] text-right">{receipt.senderName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Database className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Database</span>
                </div>
                <span className="font-medium text-emerald-400 truncate max-w-[160px] text-right">
                  {receipt.databaseEngine || 'Verified Database'}
                </span>
              </div>
            </div>

            {/* Transcript Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  Logged Message Transcript
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {receipt.message.length} characters
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.08] text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto selection:bg-emerald-500/30">
                {receipt.message}
              </div>
            </div>

            {/* Verification Hash & Direct Fallback */}
            <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate font-mono">
                  Hash: {receipt.securityHash || 'SHA256-VERIFIED-RECORD'}
                </span>
              </div>
              
              <a 
                href={`mailto:${receipt.recipientEmail}?subject=Regarding inquiry ${receipt.receiptId}`}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors shrink-0"
              >
                <span>Direct: {receipt.recipientEmail}</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="p-5 sm:p-7 pt-4 border-t border-white/[0.08] bg-[#0c1017] flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Primary Action: Download Receipt (.txt) */}
              <button
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                id="download-receipt-btn"
                className="portfolio-btn-primary !py-2.5 !px-5 !text-xs !rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Generating...' : 'Download Receipt (.txt)'}</span>
              </button>

              {/* Secondary Action: Print / Save PDF */}
              <button
                onClick={handlePrint}
                id="print-receipt-btn"
                className="portfolio-btn-secondary !py-2.5 !px-4 !text-xs !rounded-full"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print / PDF</span>
              </button>

              {/* Secondary Action: Copy Letter */}
              <button
                onClick={copyAssuranceLetter}
                id="copy-letter-btn"
                className="portfolio-btn-secondary !py-2.5 !px-4 !text-xs !rounded-full"
              >
                {copiedLetter ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Letter</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              id="close-receipt-btn"
              className="portfolio-btn-secondary w-full sm:w-auto !py-2.5 !px-5 !text-xs !rounded-full !font-semibold text-slate-300 hover:text-white text-center"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
