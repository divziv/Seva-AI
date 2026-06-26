import React, { useState, useEffect } from "react";
import { Eye, Type, BookOpen, Check, RefreshCw } from "lucide-react";

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  readingGuide: boolean;
}

interface AccessibilityControlsProps {
  settings: AccessibilitySettings;
  onChangeSettings: (settings: AccessibilitySettings) => void;
}

export default function AccessibilityControls({
  settings,
  onChangeSettings,
}: AccessibilityControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Dynamic Reading Guide effect
  useEffect(() => {
    if (!settings.readingGuide) return;

    let lastElement: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find closest text-containing or meaningful block
      const textBlock = target.closest(
        "p, h1, h2, h3, h4, h5, h6, li, span, button, input, select, .bg-slate-900, .bg-slate-950"
      ) as HTMLElement;

      if (textBlock && textBlock !== lastElement) {
        if (lastElement) {
          lastElement.classList.remove("reading-guide-highlight");
        }
        textBlock.classList.add("reading-guide-highlight");
        lastElement = textBlock;
      } else if (!textBlock && lastElement) {
        lastElement.classList.remove("reading-guide-highlight");
        lastElement = null;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (lastElement && !lastElement.contains(target)) {
        lastElement.classList.remove("reading-guide-highlight");
        lastElement = null;
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    
    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (lastElement) {
        lastElement.classList.remove("reading-guide-highlight");
      }
    };
  }, [settings.readingGuide]);

  // Dynamic High Contrast & Large Text side effects
  useEffect(() => {
    const root = document.documentElement;
    if (settings.largeText) {
      root.classList.add("text-large-active");
    } else {
      root.classList.remove("text-large-active");
    }

    if (settings.highContrast) {
      root.classList.add("high-contrast-active");
    } else {
      root.classList.remove("high-contrast-active");
    }
  }, [settings.largeText, settings.highContrast]);

  const toggleLargeText = () => {
    onChangeSettings({ ...settings, largeText: !settings.largeText });
  };

  const toggleHighContrast = () => {
    onChangeSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const toggleReadingGuide = () => {
    onChangeSettings({ ...settings, readingGuide: !settings.readingGuide });
  };

  return (
    <div className="relative" id="accessibility-controls-container">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
        title="Accessibility Settings"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Accessibility</span>
        {(settings.largeText || settings.highContrast || settings.readingGuide) && (
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
        )}
      </button>

      {/* Popover Settings Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-300 rounded-2xl p-4 shadow-xl z-50 animate-slide-in">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inclusive Reading & Display</span>
            </h4>

            <div className="space-y-3">
              {/* Option 1: Large Text */}
              <button
                onClick={toggleLargeText}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.largeText
                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Type className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Enlarge Typography</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Increases reading text scale by 15%
                    </div>
                  </div>
                </div>
                {settings.largeText && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>

              {/* Option 2: High Contrast */}
              <button
                onClick={toggleHighContrast}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.highContrast
                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">High Contrast Mode</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Strengthens color weights for readability
                    </div>
                  </div>
                </div>
                {settings.highContrast && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>

              {/* Option 3: Reading Guide */}
              <button
                onClick={toggleReadingGuide}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.readingGuide
                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold">Dynamic Reading Guide</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Highlights hovered text with dynamic borders
                    </div>
                  </div>
                </div>
                {settings.readingGuide && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>
            </div>

            {/* Reset button */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() =>
                  onChangeSettings({
                    largeText: false,
                    highContrast: false,
                    readingGuide: false,
                  })
                }
                className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>RESET OPTIONS</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
