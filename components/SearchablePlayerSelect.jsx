"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, User } from "lucide-react";

export default function SearchablePlayerSelect({
  label,
  value,
  onChange,
  players = [],
  placeholder = "Select player...",
  required = false,
  disabled = false,
  excludeId = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Available players (excluding any excluded ID, e.g., partner)
  const availablePlayers = players.filter((p) => (excludeId ? p.id !== excludeId : true));

  // Filtered by search query
  const filteredPlayers = availablePlayers.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = p.full_name?.toLowerCase().includes(q);
    const idMatch = p.player_id?.toLowerCase().includes(q);
    const deptMatch = p.contact_phone?.toLowerCase().includes(q);
    return nameMatch || idMatch || deptMatch;
  });

  const selectedPlayer = players.find((p) => p.id === value);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (playerId) => {
    onChange(playerId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block font-semibold text-primary uppercase tracking-wider mb-1 text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-lg bg-white flex items-center justify-between text-xs transition-colors shadow-2xs ${
          isOpen
            ? "border-primary ring-1 ring-primary"
            : "border-border hover:border-slate-300"
        } ${disabled ? "bg-slate-100 cursor-not-allowed text-muted" : "text-primary"}`}
      >
        <div className="flex items-center gap-2 truncate">
          <User className="w-3.5 h-3.5 text-muted shrink-0" />
          {selectedPlayer ? (
            <span className="truncate font-medium text-slate-900">
              {selectedPlayer.full_name}{" "}
              <span className="text-muted text-[11px]">
                ({selectedPlayer.player_id} • {selectedPlayer.gender})
              </span>
            </span>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedPlayer && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded text-muted hover:text-slate-700 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ""}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-border bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID (e.g. 013, Aamir)..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-border rounded-md text-primary placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 p-0.5 text-muted hover:text-slate-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Player list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredPlayers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No players match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredPlayers.map((p) => {
                const isSelected = p.id === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full px-3 py-2 text-left text-xs rounded-md flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-slate-900 truncate">
                          {p.full_name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {p.player_id}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted flex items-center gap-2 mt-0.5">
                        <span
                          className={`font-medium ${
                            p.gender === "Female" ? "text-pink-600" : "text-blue-600"
                          }`}
                        >
                          {p.gender}
                        </span>
                        {p.contact_phone && (
                          <>
                            <span>•</span>
                            <span className="truncate">{p.contact_phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick footer counter */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-border/60 text-[10px] text-muted flex items-center justify-between">
            <span>
              Showing {filteredPlayers.length} of {availablePlayers.length} players
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
