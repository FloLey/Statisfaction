import { useCallback, useEffect, useRef, useState } from "react";
import type { IdeaDetail, IdeaSummary } from "../api";
import { getIdea, getIdeas } from "../api";
import AboutIdeas from "./AboutIdeas";
import IdeaReader from "./IdeaReader";

export default function IdeasSection() {
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [selected, setSelected] = useState<IdeaDetail | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    try {
      setIdeas(await getIdeas());
    } catch {
      setError("Impossible de charger les idées.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  async function openIdea(slug: string) {
    setLoadingDetail(true);
    try {
      const detail = await getIdea(slug);
      setSelected(detail);
      window.scrollTo(0, 0);
    } catch {
      setError("Impossible de charger l'idée.");
    } finally {
      setLoadingDetail(false);
    }
  }

  if (selected) {
    return (
      <IdeaReader
        idea={selected}
        onBack={() => { setSelected(null); window.scrollTo(0, 0); }}
      />
    );
  }

  if (showAbout) {
    return (
      <AboutIdeas onBack={() => { setShowAbout(false); window.scrollTo(0, 0); }} />
    );
  }

  return (
    <div className="ideas-section">
      <header className="ideas-header">
        <div className="ideas-header-meta">Section</div>
        <h1 className="ideas-title">Idées</h1>
        <p className="ideas-subtitle">
          Des séries de schémas, animations et widgets pour explorer des idées.
        </p>
        <button className="about-link" onClick={() => setShowAbout(true)}>
          Comment ces idées sont faites →
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading && <div className="ideas-loading">Chargement…</div>}

      {loadingDetail && (
        <div className="ideas-loading ideas-loading-overlay">Chargement de l'idée…</div>
      )}

      <div className="ideas-grid">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onOpen={() => openIdea(idea.slug)} />
        ))}
      </div>

      {!loading && ideas.length === 0 && !error && (
        <div className="ideas-empty">Aucune idée pour l'instant.</div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onOpen }: { idea: IdeaSummary; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      className={`idea-card ${visible ? "visible" : ""}`}
      onClick={onOpen}
    >
      <div className="idea-card-inner">
        <div className="idea-card-number">01</div>
        <h2 className="idea-card-title">{idea.title}</h2>
        {idea.summary && <p className="idea-card-summary">{idea.summary}</p>}
        <div className="idea-card-cta">Explorer →</div>
      </div>
    </button>
  );
}
