"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, ShieldAlert, Heart, XCircle } from "lucide-react";

interface CrisisModalProps {
  onDismiss?: () => void;
}

export function CrisisModal({ onDismiss }: CrisisModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3 mb-1">
              <ShieldAlert className="w-7 h-7" />
              <h2 className="text-xl font-bold">You Are Not Alone</h2>
            </div>
            <p className="text-rose-100 text-sm">
              Real help is available right now. Please reach out.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm leading-relaxed">
              It takes courage to acknowledge when you&apos;re struggling. You matter, 
              and trained professionals are ready to support you 24/7.
            </p>

            {/* Crisis contacts */}
            <div className="space-y-3">
              <ContactCard
                icon={<PhoneCall className="w-4 h-4 text-rose-500" />}
                label="National Crisis Hotline"
                value="1-800-273-8255"
                sub="Call or text 988 anytime"
                color="bg-rose-50 border-rose-100"
              />
              <ContactCard
                icon={<Heart className="w-4 h-4 text-blue-500" />}
                label="Employee Assistance Program (EAP)"
                value="1-800-EAP-HELP"
                sub="Free & confidential counseling"
                color="bg-blue-50 border-blue-100"
              />
              <ContactCard
                icon={<ShieldAlert className="w-4 h-4 text-indigo-500" />}
                label="Company HR Support"
                value="1-800-HR-CARES"
                sub="Available Mon–Fri, 8am–6pm"
                color="bg-indigo-50 border-indigo-100"
              />
            </div>

            <p className="text-xs text-slate-400 text-center pt-2">
              If you are in immediate danger, please call{" "}
              <span className="font-bold text-slate-600">911</span>.
            </p>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                I have noted the resources — close this
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ContactCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3.5 ${color}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-slate-800 font-bold text-sm">{value}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}
