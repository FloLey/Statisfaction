export type Tab = "todo" | "done" | "stats";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  todoCount: number;
  doneCount: number;
}

const tabs: { key: Tab; label: string; hasBadge: boolean }[] = [
  { key: "todo", label: "To Do", hasBadge: true },
  { key: "done", label: "Done", hasBadge: true },
  { key: "stats", label: "Stats", hasBadge: false },
];

export default function TabNav({ activeTab, onTabChange, todoCount, doneCount }: Props) {
  const counts: Record<string, number> = { todo: todoCount, done: doneCount };

  return (
    <nav className="tab-nav" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`tab-btn${activeTab === tab.key ? " tab-btn--active" : ""}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {tab.hasBadge && counts[tab.key] > 0 && (
            <span className="tab-badge">{counts[tab.key]}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
