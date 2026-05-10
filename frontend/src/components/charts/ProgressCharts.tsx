import { ReactNode, useState } from "react";
import { Activity, SplitWithActivity } from "../../api";
import { MarkedSplit } from "./chartHelpers";

// Tab 1 — Training Load
import WeeklyMileageChart from "./WeeklyMileageChart";
import WeeklyElevationChart from "./WeeklyElevationChart";
import LongestRunPerWeekChart from "./LongestRunPerWeekChart";
import RunFrequencyChart from "./RunFrequencyChart";
import MonthlyVolumeChart from "./MonthlyVolumeChart";
import ConsistencyCalendarChart from "./ConsistencyCalendarChart";

// Tab 2 — Performance
import PaceOverTimeChart from "./PaceOverTimeChart";
import GradeAdjustedPaceChart from "./GradeAdjustedPaceChart";
import HeartRateTrendChart from "./HeartRateTrendChart";
import HrPaceEfficiencyChart from "./HrPaceEfficiencyChart";
import EffortScoreChart from "./EffortScoreChart";
import PaceImprovementChart from "./PaceImprovementChart";

// Tab 3 — Training Mix
import RunTypeDistributionChart from "./RunTypeDistributionChart";
import VolumeByRunTypeChart from "./VolumeByRunTypeChart";
import ElevationByRunTypeChart from "./ElevationByRunTypeChart";
import PaceByRunTypeChart from "./PaceByRunTypeChart";
import CumulativeDistanceChart from "./CumulativeDistanceChart";
import DistanceDistribution from "./DistanceDistribution";

type ChartsTab = "load" | "performance" | "mix";

interface Props {
  activities: Activity[];
  splits: MarkedSplit<SplitWithActivity>[];
}

function Card({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-lg shadow-sm p-4">{children}</div>;
}

const TABS: { id: ChartsTab; label: string; subtitle: string }[] = [
  { id: "load", label: "Training Load", subtitle: "Volume, frequency & terrain" },
  { id: "performance", label: "Performance", subtitle: "Pace, HR & efficiency" },
  { id: "mix", label: "Training Mix", subtitle: "Run type balance" },
];

export default function ProgressCharts({ activities, splits }: Props) {
  const [activeTab, setActiveTab] = useState<ChartsTab>("load");

  if (activities.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-400 text-sm">
          Need at least 2 activities to show progress charts.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-colors text-left ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="font-medium block">{tab.label}</span>
            <span className="text-xs text-gray-400 font-normal">{tab.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Tab 1 — Training Load */}
      {activeTab === "load" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><WeeklyMileageChart activities={activities} /></Card>
          <Card><WeeklyElevationChart activities={activities} /></Card>
          <Card><LongestRunPerWeekChart activities={activities} /></Card>
          <Card><RunFrequencyChart activities={activities} /></Card>
          <div className="lg:col-span-2">
            <Card><MonthlyVolumeChart activities={activities} /></Card>
          </div>
          <div className="lg:col-span-2">
            <Card><ConsistencyCalendarChart activities={activities} /></Card>
          </div>
        </div>
      )}

      {/* Tab 2 — Performance */}
      {activeTab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><PaceOverTimeChart splits={splits} /></Card>
          <Card><GradeAdjustedPaceChart splits={splits} /></Card>
          <Card><HeartRateTrendChart splits={splits} /></Card>
          <Card><HrPaceEfficiencyChart splits={splits} /></Card>
          <Card><EffortScoreChart splits={splits} /></Card>
          <Card><PaceImprovementChart activities={activities} /></Card>
        </div>
      )}

      {/* Tab 3 — Training Mix */}
      {activeTab === "mix" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><RunTypeDistributionChart activities={activities} /></Card>
          <Card><VolumeByRunTypeChart activities={activities} /></Card>
          <Card><PaceByRunTypeChart activities={activities} /></Card>
          <Card><ElevationByRunTypeChart activities={activities} /></Card>
          <div className="lg:col-span-2">
            <Card><CumulativeDistanceChart activities={activities} /></Card>
          </div>
          <Card><DistanceDistribution activities={activities} /></Card>
        </div>
      )}
    </div>
  );
}
