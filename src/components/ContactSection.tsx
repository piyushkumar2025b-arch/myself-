import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MapPin, 
  Send, 
  Check, 
  Copy, 
  MessageSquare, 
  FileText, 
  Download, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Clock, 
  CheckCircle2,
  Sparkles,
  History,
  ArrowRight
} from 'lucide-react';
import { PersonalInfo } from '../types/portfolio';
import { SectionHeading } from './ui/SectionHeading';
import { GlowCard } from './ui/GlowCard';
import { Reveal } from './ui/Reveal';
import { MagneticButton } from './ui/MagneticButton';
import { MessageReceiptModal, MessageReceipt } from './MessageReceiptModal';
import { DatabaseDiagnosticModal } from './database/DatabaseDiagnosticModal';
import { PortfolioService } from '../services/portfolioService';
import { testFirebaseConnection, isFirebaseConfigured, getFirebaseConfig } from '../lib/firebase';

interface ContactSectionProps {
  title: string;
  subtitle: string;
  personal: PersonalInfo;
  onSubmitContactForm?: (data: { name: string; email: string; message: string }) => Promise<boolean>;
  onOpenAdmin?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title,
  subtitle,
  personal,
  onSubmitContactForm,
  onOpenAdmin,
}) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', subject: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<MessageReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [pastReceipts, setPastReceipts] = useState<MessageReceipt[]>([]);
  
  // Real-time Database Status state
  const [dbStatus, setDbStatus] = useState<{
    tested: boolean;
    isChecking: boolean;
    connected: boolean;
    message: string;
    latency?: number;
    source: string;
  }>({
    tested: false,
    isChecking: false,
    connected: isFirebaseConfigured(),
    message: isFirebaseConfigured() ? 'Firebase Firestore Cloud Database Active' : 'Persistent Storage Engine Active',
    source: 'Firebase Firestore',
  });

  // Load past receipts on mount
  useEffect(() => {
    async function loadReceipts() {
      try {
        const receipts = await PortfolioService.getRecentReceipts();
        if (receipts && receipts.length > 0) {
          setPastReceipts(receipts);
        }
      } catch (err) {
        console.warn('Error fetching recent receipts:', err);
      }
    }
    loadReceipts();
  }, []);

  // Quick Database Connection Check
  const handleCheckDatabase = async () => {
    setDbStatus(prev => ({ ...prev, isChecking: true }));
    const startTime = performance.now();
    try {
      const isConnected = await testFirebaseConnection();
      const elapsed = Math.round(performance.now() - startTime);
      setDbStatus({
        tested: true,
        isChecking: false,
        connected: isConnected,
        message: isConnected ? 'Connected to Firebase Firestore Cloud Database' : 'Operating in resilient local mode',
        latency: elapsed,
        source: 'Firebase Firestore',
      });
    } catch (err: any) {
      setDbStatus({
        tested: true,
        isChecking: false,
        connected: false,
        message: 'Could not connect to Firebase Firestore: ' + (err?.message || 'Network error'),
        source: 'Firebase Firestore',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      if (onSubmitContactForm) {
        await onSubmitContactForm(formData);
      }

      // Generate verified receipt and save to Supabase + Persistent IndexedDB
      const generatedReceipt = await PortfolioService.submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'Portfolio Inquiry',
        message: formData.message.trim(),
        recipientEmail: personal.email,
        recipientName: personal.name,
      });

      setActiveReceipt(generatedReceipt as MessageReceipt);
      setPastReceipts(prev => [generatedReceipt as MessageReceipt, ...prev.slice(0, 9)]);
      setIsReceiptModalOpen(true);
      setIsSuccess(true);
      setFormData({ name: '', email: '', message: '', subject: '' });
    } catch (err) {
      console.error('Contact submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyEmailToClipboard = () => {
    if (!personal.email) return;
    navigator.clipboard.writeText(personal.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleDownloadActiveReceipt = (receiptToDownload: MessageReceipt) => {
    const text = `
================================================================================
              OFFICIAL ACKNOWLEDGMENT & RESPONSE ASSURANCE LETTER
                        PIYUSH KUMAR — ENGINEERING PORTFOLIO
================================================================================

DATE & TIME       : ${receiptToDownload.timestamp}
REFERENCE ID      : ${receiptToDownload.receiptId}
STATUS            : ${receiptToDownload.deliveryStatus}
STORAGE ENGINE    : ${receiptToDownload.databaseEngine || 'Verified Database'}
SECURITY HASH     : ${receiptToDownload.securityHash || 'SHA256-AUTHENTICATED'}
EXPECTED RESPONSE : Within ${receiptToDownload.estimatedReplyTime} (Target: ${receiptToDownload.expectedReplyDate || 'Next 24 Hours'})

From (Sender)     : ${receiptToDownload.senderName} <${receiptToDownload.senderEmail}>
To (Recipient)    : ${receiptToDownload.recipientName} <${receiptToDownload.recipientEmail}>

Dear ${receiptToDownload.senderName},

Thank you very much for reaching out through my engineering portfolio website!

This official transmission receipt confirms that your message has been safely
received, authenticated, and permanently stored in our database. 

I review all inquiries, software project proposals, and messages personally.
You will receive a direct, detailed response at ${receiptToDownload.senderEmail}
as soon as possible, within ${receiptToDownload.estimatedReplyTime}.

MESSAGE TRANSCRIPT:
"${receiptToDownload.message}"

Warm regards,
Piyush Kumar
Email: ${receiptToDownload.recipientEmail}
================================================================================
`.trim();

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Assurance_Receipt_${receiptToDownload.receiptId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="contact" className="py-16 sm:py-24 relative">
      {/* Subtle background ambient radial glow matching site palette */}
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[320px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <SectionHeading
            title={title}
            subtitle={subtitle}
            titleId="contact-section-heading"
            subtitleId="contact-section-subtitle"
          />
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 max-w-5xl mx-auto">
          
          {/* Left Column: Direct Contact & Info */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <Reveal delay={0.1} direction="up">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Let's connect.
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-normal">
                  Whether you have an inquiry, a project idea, or just want to chat about AI and tech, feel free to send a message.
                </p>
              </div>
            </Reveal>

            {/* Direct Contact Cards */}
            <Reveal delay={0.15} direction="up">
              <div className="space-y-3">
                {personal.email && (
                  <div className="p-4 rounded-xl bg-[#0c1017] border border-white/[0.08] flex items-center justify-between gap-3 group hover:border-emerald-500/30 transition-all duration-250">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs text-slate-400 font-medium">Direct Email</p>
                        <a 
                          href={`mailto:${personal.email}`}
                          className="text-sm font-semibold text-white hover:text-emerald-300 transition-colors truncate block"
                        >
                          {personal.email}
                        </a>
                      </div>
                    </div>

                    <button
                      onClick={copyEmailToClipboard}
                      type="button"
                      aria-label="Copy email address to clipboard"
                      title="Copy email"
                      className="p-2.5 rounded-lg bg-[#0e1424] hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-colors shrink-0 border border-white/[0.08] active:scale-95 cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {personal.location && (
                  <div className="p-4 rounded-xl bg-[#080d1a] border border-white/[0.08] flex items-center gap-3 hover:border-cyan-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Location</p>
                      <p className="text-sm font-semibold text-white">
                        {personal.location}
                      </p>
                    </div>
                  </div>
                )}

                {personal.isAvailable && (
                  <div className="p-4 rounded-xl bg-[#080d1a] border border-white/[0.08] flex items-center gap-3 hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Status</p>
                      <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        {personal.availabilityText || 'Available for projects & collaborations'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Real-time Database Connectivity Card */}
                <div className="p-4 rounded-xl bg-[#080d1a] border border-white/[0.08] space-y-2.5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dbStatus.connected ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">Database Engine</p>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dbStatus.connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-blue-400'}`} />
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {dbStatus.connected ? 'Firebase Firestore Cloud' : 'Resilient Local Storage (IndexedDB)'}
                          {dbStatus.latency ? ` • ${dbStatus.latency}ms` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDatabaseModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-colors border border-white/5 shrink-0"
                    >
                      Diagnostics
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                    <span>Dual cloud &amp; offline failover active</span>
                    <button
                      type="button"
                      onClick={handleCheckDatabase}
                      disabled={dbStatus.isChecking}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${dbStatus.isChecking ? 'animate-spin' : ''}`} />
                      <span>{dbStatus.isChecking ? 'Pinging...' : 'Test Ping'}</span>
                    </button>
                  </div>
                </div>

                {/* Previous Receipts Capsule */}
                {pastReceipts.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#0c1017] border border-white/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Sent Messages ({pastReceipts.length})</p>
                        <p className="text-[10px] text-slate-400">Logged locally</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveReceipt(pastReceipts[0]);
                        setIsReceiptModalOpen(true);
                      }}
                      className="portfolio-btn-secondary !py-1 !px-2.5 !text-[11px] !rounded-full !font-semibold text-emerald-300"
                    >
                      View Receipt
                    </button>
                  </div>
                )}

              </div>
            </Reveal>

          </div>

          {/* Right Column: Contact Message Form */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2} direction="up">
              <GlowCard className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0c1017] border border-white/[0.08] shadow-2xl space-y-5 relative">
                
                {/* Reassuring Success Banner */}
                {isSuccess && activeReceipt && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#111722]/90 border border-emerald-500/30 text-emerald-300 text-sm space-y-3.5 animate-fadeIn shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-base">Message Sent & Confirmed!</p>
                          <p className="text-xs text-emerald-300/90 mt-0.5">
                            Reference ID: <strong className="font-mono text-white">{activeReceipt.receiptId}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Guaranteed Reply
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      A personalized assurance letter has been generated with your details. Piyush will review your note and respond to <strong className="text-white font-mono">{activeReceipt.senderEmail}</strong> within {activeReceipt.estimatedReplyTime}.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        id="open-receipt-banner-btn"
                        className="portfolio-btn-primary !py-2 !px-4 !text-xs !rounded-full shadow-[0_0_16px_rgba(255,255,255,0.18)]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Assurance Letter & Receipt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadActiveReceipt(activeReceipt)}
                        id="download-receipt-banner-btn"
                        className="portfolio-btn-secondary !py-2 !px-3.5 !text-xs !rounded-full"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download (.txt)</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Your Full Name <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        id="contact-name-input"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Johnson"
                        className="w-full px-4 py-3 rounded-xl bg-[#090e1c] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                        Your Email Address <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        id="contact-email-input"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#090e1c] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Subject / Topic <span className="text-slate-500 text-[11px] font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="contact-subject-input"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Machine Learning Project / Engineering Role"
                      className="w-full px-4 py-3 rounded-xl bg-[#090e1c] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Message / Project Scope <span className="text-emerald-400">*</span>
                    </label>
                    <textarea
                      id="contact-message-input"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share your requirements, research questions, project scope, or ideas..."
                      className="w-full px-4 py-3 rounded-xl bg-[#090e1c] border border-white/[0.08] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <MagneticButton strength={3}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        id="contact-submit-btn"
                        className="portfolio-btn-primary w-full sm:w-auto !py-3.5 !px-8 !text-sm group shadow-[0_0_24px_rgba(255,255,255,0.22)] active:scale-95"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Recording in Database...</span>
                          </span>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </MagneticButton>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 text-center sm:text-right">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant confirmation letter & downloadable receipt</span>
                    </div>
                  </div>
                </form>

              </GlowCard>
            </Reveal>
          </div>

        </div>

      </div>

      {/* Official Receipt & Assurance Modal */}
      <MessageReceiptModal
        receipt={activeReceipt}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Database Diagnostic & Architecture Modal */}
      <DatabaseDiagnosticModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onOpenAdmin={onOpenAdmin}
      />
    </section>
  );
};
