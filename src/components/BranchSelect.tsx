import { useApp } from "../context/AppContext";
import { translations } from "../services/translations";
import type { ChangeEvent } from "react";
import type { Branch } from "../types/branches";

interface BranchSelectProps {
  branches: Branch[];
  value: string | number | "";
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  allowNull?: boolean;
}

export default function BranchSelect({
  branches,
  value,
  onChange,
  name = "branch_id",
  required = false,
  disabled = false,
  allowNull = true,
}: BranchSelectProps) {
  const { lang } = useApp();
  const t = translations[lang];

  return (
    <select
      name={name}
      required={required}
      disabled={disabled}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-hive/30 border border-slate-200 dark:border-stone-800 rounded-lg text-dark-hive dark:text-white focus:outline-none focus:ring-2 focus:ring-honey-gold transition-all disabled:opacity-50 capitalize"
    >
      <option value={allowNull ? "" : undefined}>
        {allowNull
          ? t.common.noBranch
          : (lang === "en" ? "-- Select Branch --" : "-- اختر الفرع --")}
      </option>
      {branches.map((b) => (
        <option
          key={b.id}
          value={String(b.id)}
          className="text-dark-hive dark:text-white bg-white dark:bg-stone-900"
        >
          {b.name}
        </option>
      ))}
    </select>
  );
}