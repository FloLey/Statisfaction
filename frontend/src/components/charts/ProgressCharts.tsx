import { ReactNode } from "react";
import { Activity, SplitWithActivity } from "../../api";
import PaceOverTimeChart from "./PaceOverTimeChart";
import WeeklyMileageChart from "./WeeklyMileageChart";
import HrPaceEfficiencyChart from "./HrPaceEfficiencyChart";
import DistanceDistribution from "./DistanceDistribution";
import MonthlyVolumeChart from "./MonthlyVolumeChart";
import CumulativeDistanceChart from "./CumulativeDistanceChart";
import PaceByDistanceBucketChart from "./PaceByDistanceBucketChart";
import HeartRateTrendChart from "./HeartRateTrendChart";
import LongestRunPerWeekChart from "./LongestRunPerWeekChart";
import ConsistencyCalendarChart from "./ConsistencyCalendarChart";
import PaceImprovementChart from "./PaceImprovementChart";
import EffortScoreChart from "./EffortScoreChart";
import RunFrequencyChart from "./RunFrequencyChart";

interface Props {
  activities: Activity[];
  splits: SplitWithActivity[];
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">{children}</div>
  );
}

export default function ProgressCharts({ activities, splits }: Props) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><PaceOverTimeChart splits={splits} /></Card>
      <Card><HeartRateTrendChart splits={splits} /></Card>
      <Card><WeeklyMileageChart activities={activities} /></Card>
      <Card><LongestRunPerWeekChart activities={activities} /></Card>
      <Card><CumulativeDistanceChart activities={activities} /></Card>
      <Card><HrPaceEfficiencyChart splits={splits} /></Card>
      <Card><PaceImprovementChart activities={activities} /></Card>
      <Card><EffortScoreChart splits={splits} /></Card>
      <Card><RunFrequencyChart activities={activities} /></Card>
      <Card><PaceByDistanceBucketChart activities={activities} /></Card>
      <Card><DistanceDistribution activities={activities} /></Card>
      <div className="lg:col-span-2">
        <Card><MonthlyVolumeChart activities={activities} /></Card>
      </div>
      <div className="lg:col-span-2">
        <Card><ConsistencyCalendarChart activities={activities} /></Card>
      </div>
    </div>
  );
}
