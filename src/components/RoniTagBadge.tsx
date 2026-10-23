import React from 'react';

interface RoniTagBadgeProps {
  equipped?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showTooltip?: boolean;
}

export const RoniTagBadge: React.FC<RoniTagBadgeProps> = ({
  equipped = true,
  onClick,
  size = 'md',
  interactive = false,
  showTooltip = true,
}) => {
  if (!equipped) {
    return (
      <span
        onClick={onClick}
        title={showTooltip ? "RONI Server Tag Missing - Click to equip" : undefined}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/50 border border-red-500/40 text-red-300 font-semibold text-xs tracking-wide ${
          interactive ? 'cursor-pointer hover:bg-red-900/60 transition-colors' : ''
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        NO TAG
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-2.5 py-1 text-sm gap-2'
  }[size];

  return (
    <span
      onClick={onClick}
      title={showTooltip ? "Equipped Official Server Tag: RONI" : undefined}
      className={`inline-flex items-center rounded-md font-bold text-white shadow-sm select-none ${sizeClasses} ${
        interactive ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      }`}
      style={{
        backgroundColor: '#2b2d31',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)'
      }}
    >
      {/* Purple Crescent Icon as depicted in screenshot */}
      <svg
        className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="#c084fc" strokeWidth="3" />
        <path
          d="M12 2A10 10 0 0 0 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2Z"
          fill="#a855f7"
        />
        <circle cx="12" cy="8" r="6" fill="#2b2d31" />
      </svg>
      <span className="font-extrabold tracking-wider text-neutral-100">RONI</span>
    </span>
  );
};
