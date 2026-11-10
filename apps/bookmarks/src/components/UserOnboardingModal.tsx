import React, { useState } from 'react';
import { Users, ArrowRight, Plus, Loader2, AlertCircle, Check } from 'lucide-react';
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
  isSharedLink = false,
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

  const isWaitingForPeers = isSharedLink && validMembers.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative border border-indigo-100 dark:border-slate-800 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-300/30 dark:bg-indigo-900/20 rounded-full blur-2xl pointer-events-none" />

        {isWaitingForPeers ? (
          <div className="text-center py-4 px-1">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Connecting to Space...</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Syncing shared links and member directory directly from active peers via P2P mesh...
            </p>

            <div className="mt-4 mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full ${peersCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <span>
                {peersCount > 0
                  ? `${peersCount} peer(s) connected • Syncing data...`
                  : 'Discovering peers in mesh...'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddNew(true)}
                className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 underline transition"
              >
                Or enter name to join now
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Who are you?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your name or add your name to publish and curate links
              </p>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!showAddNew && validMembers.length > 0 ? (
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
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                            Member
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
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
                  className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex items-center justify-center gap-1.5 mt-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>I'm not listed (Add my name)</span>
                </button>
              </div>
            ) : (
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
                    placeholder="Enter your name..."
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  {validMembers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddNew(false);
                        setErrorMessage(null);
                      }}
                      className="w-1/2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!customNameInput.trim()}
                    className={`${
                      validMembers.length > 0 ? 'w-1/2' : 'w-full'
                    } py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25 transition disabled:opacity-50`}
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
