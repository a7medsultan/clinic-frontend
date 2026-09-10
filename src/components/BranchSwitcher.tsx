import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAccessibleBranches } from "../hooks/useAccessibleBranches";
import { translations } from "../services/translations";
import { Building2, Check, ChevronDown, Layers, Loader2 } from "lucide-react";

export default function BranchSwitcher() {
  const { lang } = useApp();
  const { user, switchBranch } = useAuth();
  const { showToast } = useToast();
  const { branches } = useAccessibleBranches();
  const t = translations[lang];

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const isAdmin = user?.role_name === "admin";
  const isAll = user?.branch_scope === "all";
  const activeBranchId = user?.branch_id ?? null;

  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  if (!user) return null;

  const activeName = isAll
    ? t.common.allBranches
    : branches.find((b) => b.id === activeBranchId)?.name || t.common.noBranch;

  // Nothing to switch between: render a static scope indicator instead
  const totalOptions = (isAdmin ? 1 : 0) + branches.length;
  if (totalOptions < 2) {
    return (
      <button
        type="button"
        disabled
        title={t.common.switchBranch}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-stone-800 text-slate-700 dark:text-stone-300 cursor-default"
      >
        {isAll ? <Layers size={14} /> : <Building2 size={14} />}
        <span className="max-w-[140px] truncate">{activeName}</span>
      </button>
    );
  }

  const handleSelect = async (branchId: number | null) => {
    setOpen(false);
    const alreadySelected =
      branchId === null ? isAll : branchId === activeBranchId;
    if (alreadySelected) return;

    setSwitching(true);
    try {
      await switchBranch(branchId);
      showToast(
        branchId === null ? t.common.branchSwitchedAll : t.common.branchSwitched,
        "success",
      );
    } catch (err: any) {
      showToast(err.message || t.common.switchError, "error");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={switching}
        title={t.common.switchBranch}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/50 disabled:opacity-60 cursor-pointer"
      >
        {switching ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Building2 size={14} />
        )}
        <span className="max-w-[140px] truncate">{activeName}</span>
        <ChevronDown
          size={13}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-40 mt-2 w-56 bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-xl shadow-xl py-1.5 animate-fade-in font-sans ${
            lang === "ar" ? "left-0 origin-top-left" : "right-0 origin-top-right"
          }`}
        >
          <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-stone-500">
            {t.common.switchBranch}
          </p>

          {isAdmin && (
            <button
              onClick={() => handleSelect(null)}
              className={`w-full px-3.5 py-2 text-xs font-bold flex items-center gap-2 text-left rtl:text-right transition-colors cursor-pointer ${
                isAll
                  ? "bg-bee-yellow/10 text-honey-gold"
                  : "text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/60"
              }`}
            >
              <Layers size={14} />
              <span className="flex-1">{t.common.allBranches}</span>
              {isAll && <Check size={14} />}
            </button>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-stone-800/60" />

          {branches.map((b) => {
            const isCurrent = !isAll && b.id === activeBranchId;
            return (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                className={`w-full px-3.5 py-2 text-xs font-bold flex items-center gap-2 text-left rtl:text-right transition-colors cursor-pointer ${
                  isCurrent
                    ? "bg-bee-yellow/10 text-honey-gold"
                    : "text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800/60"
                }`}
              >
                <Building2 size={14} />
                <span className="flex-1 truncate">{b.name}</span>
                {isCurrent && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}