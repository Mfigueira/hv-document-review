import { useState } from 'react';
import { useReviewStore } from '../../store/useReviewStore';
import type { Scenario } from '../../api/reviewApi';

/**
 * Floating dev panel for switching demo scenarios and resetting resolved state.
 */
const VITE_SHOW_DEV_PANEL = import.meta.env.VITE_SHOW_DEV_PANEL === 'true';
const IS_DEV = import.meta.env.DEV || VITE_SHOW_DEV_PANEL;

export function DevPanel() {
  const scenario = useReviewStore((s) => s.scenario);
  const setScenario = useReviewStore((s) => s.setScenario);
  const resetResolved = useReviewStore((s) => s.resetResolved);
  const [collapsed, setCollapsed] = useState(false);

  if (!IS_DEV) return null;

  return (
    <div
      role="region"
      aria-label="Developer panel"
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9000 }}
      className="w-52 rounded-xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-sm"
    >
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between rounded-t-xl px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:bg-gray-50"
        aria-expanded={!collapsed}
        aria-controls="dev-panel-body"
      >
        <span>⚙ Dev panel</span>
        <span aria-hidden="true" className="text-gray-300">
          {collapsed ? '▲' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div id="dev-panel-body" className="px-3 pb-3 pt-1">
          {/* Scenario selector */}
          <fieldset className="mb-3">
            <legend className="mb-1.5 text-[11px] font-medium text-gray-500">Scenario</legend>

            {(
              [
                { value: 'needs_revision', label: 'A — Needs revision' },
                { value: 'clean', label: 'B — Clean (minor only)' },
              ] as { value: Scenario; label: string }[]
            ).map(({ value, label }) => (
              <label
                key={value}
                className="mb-1 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="dev-scenario"
                  value={value}
                  checked={scenario === value}
                  onChange={() => setScenario(value)}
                  className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                />
                <span className="text-xs text-gray-700">{label}</span>
              </label>
            ))}
          </fieldset>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetResolved}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Reset resolved state
          </button>
        </div>
      )}
    </div>
  );
}
