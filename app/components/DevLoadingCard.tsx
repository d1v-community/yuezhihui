export const DEV_LOADING_CARD_TEMPLATE_ID = "REPLACE_DEV_LOADING_CARD";

export function DevLoadingCard() {
  return (
    <section
      data-template={DEV_LOADING_CARD_TEMPLATE_ID}
      className="h-full w-full"
    >
      <div className="flex h-full w-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:shadow-slate-950/40">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
                template
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Replace <span className="font-medium">DevLoadingCard</span> with your feature.
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {DEV_LOADING_CARD_TEMPLATE_ID}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 dark:border-slate-800 dark:bg-slate-950/80">
            <svg
              viewBox="0 0 320 160"
              className="h-40 w-full text-slate-200"
              role="img"
              aria-label="Placeholder template under construction"
            >
              <defs>
                <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                  <stop offset="40%" stopColor="#22c55e" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="block" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="crane" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* ground and grid */}
              <g opacity="0.25">
                <path d="M16 40H304" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 6" />
                <path d="M16 80H304" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 6" />
                <path d="M16 120H304" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 6" />
              </g>
              <path d="M16 132H304" stroke="#0f172a" strokeWidth="1.5" />

              {/* crane tower */}
              <g>
                <rect x="44" y="32" width="6" height="90" fill="url(#crane)" />
                <rect
                  x="44"
                  y="32"
                  width="6"
                  height="90"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="0.8"
                />
                <rect x="50" y="38" width="90" height="5" fill="#facc15" />
                <rect
                  x="50"
                  y="38"
                  width="90"
                  height="5"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="0.8"
                />

                {/* crane cable and hook with moving block */}
                <line
                  x1="120"
                  y1="43"
                  x2="120"
                  y2="90"
                  stroke="#eab308"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                >
                  <animate
                    attributeName="y2"
                    values="70; 90; 70"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </line>
                <rect x="115" y="90" width="10" height="6" fill="#eab308">
                  <animate
                    attributeName="y"
                    values="66; 88; 66"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect x="108" y="96" width="24" height="10" fill="url(#block)">
                  <animate
                    attributeName="y"
                    values="72; 94; 72"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>

              {/* hello blocks being stacked */}
              <g>
                {/* base beam */}
                <rect
                  x="64"
                  y="118"
                  width="192"
                  height="8"
                  rx="2"
                  fill="#020617"
                  stroke="#111827"
                  strokeWidth="1"
                />
                <rect x="64" y="118" width="80" height="8" rx="2" fill="url(#beam)">
                  <animate
                    attributeName="width"
                    values="40; 140; 90; 160; 80"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </rect>

                {/* rising blocks hinting "HELLO" */}
                <rect x="72" y="104" width="12" height="14" rx="2" fill="url(#block)">
                  <animate
                    attributeName="height"
                    values="4; 14; 10; 14"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values="128; 104; 110; 104"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect
                  x="92"
                  y="96"
                  width="12"
                  height="22"
                  rx="2"
                  fill="url(#block)"
                  opacity="0.9"
                >
                  <animate
                    attributeName="height"
                    values="6; 22; 18; 22"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values="126; 96; 104; 96"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect
                  x="112"
                  y="100"
                  width="12"
                  height="18"
                  rx="2"
                  fill="url(#block)"
                  opacity="0.8"
                >
                  <animate
                    attributeName="height"
                    values="4; 18; 14; 18"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values="128; 100; 108; 100"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect x="132" y="92" width="12" height="26" rx="2" fill="url(#block)">
                  <animate
                    attributeName="height"
                    values="10; 26; 20; 26"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values="124; 92; 102; 92"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect
                  x="152"
                  y="100"
                  width="12"
                  height="18"
                  rx="2"
                  fill="url(#block)"
                  opacity="0.9"
                >
                  <animate
                    attributeName="height"
                    values="6; 18; 12; 18"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="y"
                    values="126; 100; 110; 100"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>

              {/* placeholder label as blueprint text */}
              <g>
                <rect
                  x="176"
                  y="40"
                  width="150"
                  height="40"
                  rx="8"
                  fill="#020617"
                  stroke="#1f2937"
                  strokeWidth="1.2"
                />
                <text x="188" y="58" fontSize="11" fill="#e5e7eb" letterSpacing="0.12em">
                  TEMPLATE
                </text>
                <text x="188" y="72" fontSize="9" fill="#9ca3af">
                  replace this component
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            This is a full-page placeholder. Swap it out when implementing your feature.
          </div>
        </div>
      </div>
    </section>
  );
}
