import React from 'react';
import { ContactSettings, FooterSettings } from '../../types/portfolio';
import { Mail, Phone, MapPin, Shield, CheckCircle2, ArrowUpCircle } from 'lucide-react';

interface AdminContactFooterManagerProps {
  contact: ContactSettings;
  footer: FooterSettings;
  onChangeContact: (contact: ContactSettings) => void;
  onChangeFooter: (footer: FooterSettings) => void;
}

export const AdminContactFooterManager: React.FC<AdminContactFooterManagerProps> = ({
  contact,
  footer,
  onChangeContact,
  onChangeFooter,
}) => {
  return (
    <div className="space-y-6">
      {/* Contact Section Settings */}
      <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Contact Section Settings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure direct contact channels and form availability.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Contact Card Heading
            </label>
            <input
              type="text"
              value={contact.heading || ''}
              onChange={(e) => onChangeContact({ ...contact, heading: e.target.value })}
              placeholder="Let's build something extraordinary"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Direct Contact Email *
            </label>
            <input
              type="email"
              value={contact.email || ''}
              onChange={(e) => onChangeContact({ ...contact, email: e.target.value })}
              placeholder="dani009567@gmail.com"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Card Description
          </label>
          <textarea
            rows={2}
            value={contact.description || ''}
            onChange={(e) => onChangeContact({ ...contact, description: e.target.value })}
            placeholder="Feel free to reach out for collaborations or inquiries..."
            className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Phone / WhatsApp (optional)</span>
            </label>
            <input
              type="text"
              value={contact.phone || ''}
              onChange={(e) => onChangeContact({ ...contact, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location / City</span>
            </label>
            <input
              type="text"
              value={contact.location || ''}
              onChange={(e) => onChangeContact({ ...contact, location: e.target.value })}
              placeholder="Chennai, Tamil Nadu, India"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={contact.formEnabled ?? true}
              onChange={(e) => onChangeContact({ ...contact, formEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500"
            />
            <span className="font-semibold text-white">Enable Interactive Contact Form</span>
            <span className="text-slate-400 text-[11px]">(Allows visitors to submit verified messages directly into database)</span>
          </label>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Footer & System Status Settings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">Configure copyright text, operational status bar, and back-to-top button.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Footer Copyright Notice
            </label>
            <input
              type="text"
              value={footer.copyrightText || ''}
              onChange={(e) => onChangeFooter({ ...footer, copyrightText: e.target.value })}
              placeholder="Piyush Kumar. Engineered with clean architecture."
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status Text (Green Pulse Indicator)</span>
            </label>
            <input
              type="text"
              value={footer.statusText || ''}
              onChange={(e) => onChangeFooter({ ...footer, statusText: e.target.value })}
              placeholder="All systems operational"
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={footer.showBackToTop ?? true}
              onChange={(e) => onChangeFooter({ ...footer, showBackToTop: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-500"
            />
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Show Back-to-Top Button</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
