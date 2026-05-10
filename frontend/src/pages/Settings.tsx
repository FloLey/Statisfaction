import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserSettings,
  updateUserSettings,
  reclassifySplits,
  UserSettings,
} from "../api";

// ---------------------------------------------------------------------------
// Collapsible explanation panel
// ---------------------------------------------------------------------------

function ClassificationGuide() {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">📖</span>
          <span className="text-sm font-semibold text-gray-800">
            How classification works
          </span>
          <span className="text-xs text-gray-400 font-normal">
            — splits &amp; run types explained
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${open ? "opacity-100" : "opacity-0 max-h-0 overflow-hidden"}`}
        style={open ? { maxHeight: contentRef.current?.scrollHeight ?? 9999 } : { maxHeight: 0 }}
      >
        <div className="px-5 pb-5 border-t border-gray-100 space-y-6 pt-4">

          {/* Split types */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Step 1 — Each 1 km split gets a type
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Garmin records your run as a series of 1 km splits. Each split is labelled
              based on its average pace, using the thresholds you set below.
              The order of priority is: <span className="font-medium text-gray-700">idle → walking → fast → running</span>.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  badge: "bg-red-100 text-red-700",
                  label: "Fast",
                  desc: "Pace is below the sprint threshold. Intense effort — intervals, tempo bursts.",
                  example: "e.g. &lt; 4:00 min/km",
                },
                {
                  badge: "bg-blue-100 text-blue-700",
                  label: "Running",
                  desc: "Comfortable running pace, between the fast and walking thresholds.",
                  example: "e.g. 4:00 – 10:00 min/km",
                },
                {
                  badge: "bg-yellow-100 text-yellow-700",
                  label: "Walking",
                  desc: "Pace above the walk threshold but below the stop threshold. Recovery walk or hiking.",
                  example: "e.g. 10:00 – 20:00 min/km",
                },
                {
                  badge: "bg-gray-100 text-gray-500",
                  label: "Idle",
                  desc: "Pace above the stop threshold. GPS is still on but you're essentially stopped — waiting at traffic lights, stretching.",
                  example: "e.g. &gt; 20:00 min/km",
                },
              ].map(({ badge, label, desc, example }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold flex-shrink-0 ${badge}`}>
                    {label}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {desc}{" "}
                    <span
                      className="text-gray-400"
                      dangerouslySetInnerHTML={{ __html: example }}
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Run types */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Step 2 — The run gets a type based on its split pattern
            </h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Once all splits are labelled, the whole run is classified by looking at how
              the fast splits are distributed. Types are <span className="font-medium text-gray-700">mutually exclusive</span>{" "}
              and checked in priority order: <span className="font-medium text-gray-700">Hills → Sprints → Tempo → Long → Easy</span>.
            </p>
            <div className="space-y-3">
              {[
                {
                  badge: "bg-green-100 text-green-700",
                  label: "Hills",
                  priority: "1st",
                  desc: (
                    <>
                      Interval pattern detected <em>and</em> the average elevation gain on fast
                      splits exceeds the hills threshold. Typically trail or hill-repeat sessions
                      with significant climb on fast segments.
                    </>
                  ),
                },
                {
                  badge: "bg-red-100 text-red-700",
                  label: "Sprints",
                  priority: "2nd",
                  desc: (
                    <>
                      Interval pattern detected: at least <em>N</em> fast splits with a
                      fast↔recovery alternating structure (e.g. fast km, walk, fast km, walk…).
                      The alternation ratio controls how strict this check is.
                    </>
                  ),
                },
                {
                  badge: "bg-orange-100 text-orange-700",
                  label: "Tempo",
                  priority: "3rd",
                  desc: (
                    <>
                      Fast splits are present but not arranged in an interval pattern — typically
                      a sustained effort block in the middle of a run. The fast fraction threshold
                      ensures the fast portion is meaningful (not just one lucky km).
                    </>
                  ),
                },
                {
                  badge: "bg-purple-100 text-purple-700",
                  label: "Long",
                  priority: "4th",
                  desc: (
                    <>
                      No fast splits at all, and total distance meets the long-run threshold.
                      Easy aerobic effort at comfortable pace — the backbone of endurance training.
                    </>
                  ),
                },
                {
                  badge: "bg-blue-100 text-blue-700",
                  label: "Easy",
                  priority: "5th",
                  desc: (
                    <>
                      Default when none of the above conditions apply: short or moderate run at
                      comfortable pace, no fast splits, below the long-run distance threshold.
                    </>
                  ),
                },
              ].map(({ badge, label, priority, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${badge}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-gray-300 font-medium">{priority}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

interface FieldDef {
  key: keyof UserSettings;
  label: string;
  unit: string;
  step: number;
  min: number;
  tooltip: string;
}

const SPLIT_FIELDS: FieldDef[] = [
  {
    key: "pace_fast_max_min_km",
    label: "Sprint threshold",
    unit: "min/km",
    step: 0.1,
    min: 2,
    tooltip:
      "Splits below this pace are classified as \"fast\" (sprint). " +
      "Lower = only very fast bursts qualify. " +
      "Typical: 4:00 for elite runners, 5:00 for recreational runners.",
  },
  {
    key: "pace_walking_min_km",
    label: "Walk threshold",
    unit: "min/km",
    step: 0.5,
    min: 5,
    tooltip:
      "Splits above this pace are classified as \"walking\". " +
      "Rarely needs changing. Typical: 10:00 min/km.",
  },
  {
    key: "pace_idle_min_km",
    label: "Stop threshold",
    unit: "min/km",
    step: 1,
    min: 10,
    tooltip:
      "Splits above this pace are classified as \"idle\" (GPS still recording, but you're stopped or nearly still). " +
      "Typical: 20:00 min/km.",
  },
];

const RUN_TYPE_FIELDS: FieldDef[] = [
  {
    key: "long_run_min_km",
    label: "Long run distance",
    unit: "km",
    step: 1,
    min: 5,
    tooltip:
      "A run with no fast splits above this distance is classified as \"Long\". " +
      "Typical: 12 km for half-marathon training, 15–20 km for marathon.",
  },
  {
    key: "hills_elev_per_km_threshold",
    label: "Hills elevation",
    unit: "m/km on fast splits",
    step: 5,
    min: 5,
    tooltip:
      "Average elevation gain on fast splits needed to classify intervals as \"Hills\" instead of \"Sprints\". " +
      "30 m/km ≈ 3% average grade. Increase if your hills are very steep (trail running).",
  },
  {
    key: "tempo_min_fast_fraction",
    label: "Tempo fast fraction",
    unit: "ratio (0–1)",
    step: 0.01,
    min: 0.01,
    tooltip:
      "Minimum share of total distance run at \"fast\" pace to classify the run as \"Tempo\". " +
      "0.15 = at least 15% of distance must be fast. Lower this if your tempo efforts are short.",
  },
  {
    key: "interval_min_fast_splits",
    label: "Min interval count",
    unit: "splits",
    step: 1,
    min: 1,
    tooltip:
      "Minimum number of fast splits required to detect an interval pattern (Sprints/Hills). " +
      "Increase to require more repetitions before labelling a run as intervals.",
  },
  {
    key: "interval_alt_ratio",
    label: "Alternation ratio",
    unit: "ratio (0–1)",
    step: 0.05,
    min: 0.1,
    tooltip:
      "Share of transitions that must alternate between fast and recovery (walk/idle) to detect an interval pattern. " +
      "0.60 = 60% of transitions must be fast→recovery or recovery→fast. " +
      "Lower to be more permissive with back-to-back fast splits.",
  },
];

export default function Settings() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    getUserSettings(Number(userId))
      .then(setSettings)
      .catch(() => setStatus({ type: "error", message: "Failed to load settings." }))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (key: keyof UserSettings, value: string) => {
    if (!settings) return;
    const parsed = key === "interval_min_fast_splits" ? parseInt(value, 10) : parseFloat(value);
    if (!isNaN(parsed)) {
      setSettings({ ...settings, [key]: parsed });
    }
  };

  const handleSaveAndReclassify = async () => {
    if (!settings) return;
    setSaving(true);
    setStatus(null);
    try {
      await updateUserSettings(Number(userId), settings);
      const result = await reclassifySplits(Number(userId));
      setStatus({
        type: "success",
        message: `Saved! Reclassified ${result.updated_run_types} runs and ${result.updated_splits} splits.`,
      });
    } catch {
      setStatus({ type: "error", message: "Failed to save or reclassify. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Loading settings…
      </div>
    );
  }

  if (!settings) return null;

  const renderField = (field: FieldDef) => (
    <div key={field.key} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800">{field.label}</span>
          <span className="text-xs text-gray-400 font-normal">— {field.unit}</span>
          <span
            title={field.tooltip}
            className="ml-1 w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center cursor-help hover:bg-blue-100 hover:text-blue-600 transition-colors flex-shrink-0"
          >
            i
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2 pr-4">
          {field.tooltip}
        </p>
      </div>
      <input
        type="number"
        value={settings[field.key]}
        step={field.step}
        min={field.min}
        onChange={(e) => handleChange(field.key, e.target.value)}
        className="w-24 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Classification Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Adjust how your runs and splits are automatically categorised.
          </p>
        </div>
        <button
          onClick={() => navigate(`/users/${userId}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* How classification works */}
      <ClassificationGuide />

      {/* Split Classification */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Split Classification
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Pace thresholds that determine how each 1 km split is labelled.
        </p>
        {SPLIT_FIELDS.map(renderField)}
      </div>

      {/* Run Type Classification */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Run Type Classification
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Thresholds used to label each run as Easy, Long, Tempo, Sprints, or Hills.
        </p>
        {RUN_TYPE_FIELDS.map(renderField)}
      </div>

      {/* Status message */}
      {status && (
        <div
          className={`mb-4 px-4 py-3 rounded-md text-sm ${
            status.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSaveAndReclassify}
        disabled={saving}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving & Reclassifying…" : "Save & Reclassify"}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        This will re-label all your existing splits and runs using the new thresholds.
      </p>
    </div>
  );
}
