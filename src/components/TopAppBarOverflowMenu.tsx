/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Database, FileText, Settings } from 'lucide-react';
import { IconButton } from './ui';

interface TopAppBarOverflowMenuProps {
  onOpenProvenance: () => void;
  onOpenBriefing: () => void;
  onOpenSettings?: () => void;
}

export const TopAppBarOverflowMenu: React.FC<TopAppBarOverflowMenuProps> = ({
  onOpenProvenance,
  onOpenBriefing,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative inline-block lg:hidden">
      <IconButton
        icon={<MoreVertical className="w-4 h-4" />}
        aria-label="More actions menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        size="md"
      />

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 glass-modal rounded-xl border border-white/10 shadow-2xl p-1.5 z-[var(--z-dropdown,50)] animate-in fade-in zoom-in-95 duration-100 font-mono text-xs"
        >
          <button
            role="menuitem"
            onClick={() => {
              onOpenProvenance();
              setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span>NASA Provenance Data</span>
          </button>

          <button
            role="menuitem"
            onClick={() => {
              onOpenBriefing();
              setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Flight Rule Briefing</span>
          </button>

          {onOpenSettings && (
            <button
              role="menuitem"
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span>System Settings</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
