"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X } from "lucide-react";
import type { SuggestionItem } from "@/lib/public-search";

interface InstantSearchBoxProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
}

export function InstantSearchBox({
  defaultValue = "",
  placeholder = "식당, 지역, 업종 검색",
  autoFocus = false,
  compact = false,
}: InstantSearchBoxProps) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    fetch(`/api/search-suggest?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: SuggestionItem[]) => {
        setSuggestions(data);
        setOpen(data.length > 0);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 180);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    const q = value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    setOpen(false);
    setValue(item.name);
    if (item.lat !== null) {
      router.push(`/map?q=${encodeURIComponent(item.name)}`);
    } else {
      router.push(`/restaurants/${item.id}`);
    }
  };

  const handleMapSearch = () => {
    setOpen(false);
    const q = value.trim();
    router.push(q ? `/map?q=${encodeURIComponent(q)}` : "/map");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const inputHeight = compact ? "36px" : "44px";
  const btnHeight = compact ? "36px" : "44px";
  const fontSize = compact ? "13px" : "14px";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
        {/* 검색 인풋 */}
        <div style={{ flex: 1, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "11px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Search size={compact ? 14 : 16} />
          </span>
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim() && suggestions.length > 0) setOpen(true);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            style={{
              width: "100%",
              height: inputHeight,
              paddingLeft: compact ? "30px" : "34px",
              paddingRight: value ? "32px" : "10px",
              paddingTop: 0,
              paddingBottom: 0,
              border: "1.5px solid var(--line)",
              borderRadius: "10px",
              fontSize,
              fontWeight: 500,
              color: "var(--ink)",
              background: "white",
              outline: "none",
            }}
            className="focus:border-[var(--brand)]"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              style={{
                position: "absolute",
                right: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "3px",
                display: "flex",
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          style={{
            height: btnHeight,
            padding: "0 14px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          검색
        </button>

        {/* 지도 버튼 */}
        {!compact && (
          <button
            type="button"
            onClick={handleMapSearch}
            style={{
              height: btnHeight,
              padding: "0 12px",
              background: "white",
              color: "var(--brand)",
              border: "1.5px solid var(--brand)",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <MapPin size={12} />
            지도
          </button>
        )}
      </form>

      {/* 자동완성 드롭다운 */}
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid var(--line)",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                background: i === selectedIndex ? "var(--bg)" : "white",
                border: "none",
                borderBottom: i < suggestions.length - 1 ? "1px solid var(--line)" : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: "52px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#555",
                  background: "#f3f4f6",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  flexShrink: 0,
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.businessType}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </span>
              <span style={{ fontSize: "11px", color: "var(--muted)", flexShrink: 0 }}>
                {item.sido} {item.sigungu ?? ""}
              </span>
              {item.lat !== null && (
                <span style={{ fontSize: "10px", color: "var(--brand)", fontWeight: 700, flexShrink: 0 }}>
                  지도↗
                </span>
              )}
            </button>
          ))}
          {/* 전체 결과 보기 */}
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bg)",
              border: "none",
              borderTop: "1px solid var(--line)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--brand)",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            &quot;{value}&quot; 전체 결과 보기 →
          </button>
        </div>
      )}
    </div>
  );
}
