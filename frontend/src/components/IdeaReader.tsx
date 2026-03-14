import { useEffect, useRef, useState } from "react";
import type { IdeaDetail, IdeaSection } from "../api";
import WidgetRenderer from "./WidgetRenderer";

interface Props {
  idea: IdeaDetail;
  onBack: () => void;
}

function SectionBlock({ section }: { section: IdeaSection }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const isSpecial = section.section_number === "⊙";

  return (
    <div
      ref={ref}
      className={`idea-section ${visible ? "visible" : ""} voice-${section.voice ?? "neutral"}`}
    >
      {section.section_number && (
        <div className={`section-number ${isSpecial ? "section-special" : ""}`}>
          {section.section_number}
        </div>
      )}
      {section.title && (
        <h2 className="section-title">{section.title}</h2>
      )}
      <div className="section-content">
        {section.content.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {section.widgets.map((w) => (
        <WidgetRenderer key={w.id} widget={w} />
      ))}
    </div>
  );
}

function TableOfContents({ idea, activeId, onNav }: {
  idea: IdeaDetail;
  activeId: number | null;
  onNav: (id: number) => void;
}) {
  const seen = new Set<string>();
  const entries: IdeaSection[] = [];
  for (const s of idea.sections) {
    if (s.title && s.section_number && !seen.has(s.section_number)) {
      seen.add(s.section_number);
      entries.push(s);
    }
  }

  return (
    <nav className="idea-toc">
      {entries.map((s) => (
        <button
          key={s.id}
          className={`toc-item ${activeId === s.id ? "active" : ""}`}
          onClick={() => onNav(s.id)}
        >
          <span className="toc-num">{s.section_number}</span>
          <span className="toc-title">{s.title}</span>
        </button>
      ))}
    </nav>
  );
}

export default function IdeaReader({ idea, onBack }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLElement>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = Number(e.target.getAttribute("data-section-id"));
            setActiveId(id);
          }
        }
      },
      { threshold: 0.3 }
    );
    Object.values(sectionRefs.current).forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [idea]);

  function navTo(id: number) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="idea-reader">
      <div className="idea-reader-inner">
        <aside className="idea-sidebar">
          <button className="back-btn" onClick={onBack}>← Idées</button>
          <TableOfContents idea={idea} activeId={activeId} onNav={navTo} />
        </aside>

        <article className="idea-body">
          <header className="idea-header">
            <div className="idea-header-meta">Idée</div>
            <h1 className="idea-main-title">{idea.title}</h1>
            {idea.summary && <p className="idea-summary">{idea.summary}</p>}
          </header>

          {idea.sections.map((section) => (
            <div
              key={section.id}
              data-section-id={section.id}
              ref={(el) => {
                if (el) sectionRefs.current[section.id] = el;
              }}
            >
              <SectionBlock section={section} />
            </div>
          ))}
        </article>
      </div>
    </div>
  );
}
