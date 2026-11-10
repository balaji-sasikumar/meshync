import React, { useState } from 'react';
import { Users, ArrowRight, Plus, AlertCircle, Check, X } from 'lucide-react';
import { getAvatarColor } from '../domain/schema.ts';

interface UserOnboardingModalProps {
  isOpen: boolean;
  currentUserName: string;
  existingMembers: string[];
  onSelectUser: (userName: string) => void;
  onClose?: () => void;
  isSharedLink?: boolean;
  peersCount?: number;
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({
  isOpen,
  currentUserName,
  existingMembers,
  onSelectUser,
  onClose,
  peersCount = 0
}) => {
  const [customNameInput, setCustomNameInput] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const validMembers = existingMembers.filter(
    m => Boolean(m.trim()) && m.toLowerCase() !== 'you'
  );

  const handleSaveCustomUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = customNameInput.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'you') {
      setErrorMessage("Please enter an actual name, not 'You'.");
      return;
    }

    onSelectUser(trimmed);
  };

  const isChoosingExisting = !showAddNew && validMembers.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Dismiss X button if user already has an active profile */}
        {Boolean(currentUserName) && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition absolute top-4 right-4"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isChoosingExisting ? 'Who are you?' : 'Welcome to Bookmarks'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isChoosingExisting
              ? 'Select your name or add your name to publish and curate links'
              : 'Enter your name to start saving and sharing links in this space'}
          </p>
        </div>

        {/* Peer Status Badge (Non-blocking) */}
        {peersCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 mb-4 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{peersCount} peer{peersCount > 1 ? 's' : ''} connected in encrypted mesh</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-3.5 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isChoosingExisting ? (
          /* Pick from Existing Members */
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {validMembers.map(name => {
              const isSelected = currentUserName?.toLowerCase() === name.toLowerCase();
              const color = getAvatarColor(name);

              return (
                <button
                  key={name}
                  onClick={() => onSelectUser(name)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${color.bg} ${color.text}`}
                    >
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Space Member
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setShowAddNew(true);
                setErrorMessage(null);
              }}
              className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all flex items-center justify-center gap-1.5 mt-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>I'm not listed (Add my name)</span>
            </button>
          </div>
        ) : (
          /* Enter Name Directly */
          <form onSubmit={handleSaveCustomUser} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={customNameInput}
                onChange={e => setCustomNameInput(e.target.value)}
                placeholder="Enter your name (e.g. Alex)..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-1">
              {validMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNew(false);
                    setErrorMessage(null);
                  }}
                  className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className={`py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-1.5 ${
                  validMembers.length > 0 ? 'w-2/3' : 'w-full'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
