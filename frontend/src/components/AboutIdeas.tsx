interface Props {
  onBack: () => void;
}

export default function AboutIdeas({ onBack }: Props) {
  return (
    <div className="about-ideas">
      <div className="about-ideas-inner">
        <button className="back-btn" onClick={onBack}>← Idées</button>

        <header className="about-header">
          <div className="about-meta">À propos</div>
          <h1 className="about-title">Comment ces idées sont faites</h1>
        </header>

        <div className="about-body">
          <p>
            Ces idées partent de moi. D'une image qui s'impose, d'une métaphore qui tient, d'une façon
            de voir quelque chose que je n'arrive pas à secouer. Je les note. Je les pousse. Je les
            construis jusqu'à ce qu'elles aient une forme.
          </p>

          <p>
            Ensuite je travaille avec une IA pour les développer — pas pour qu'elle pense à ma place,
            mais pour qu'elle m'aide à aller plus loin dans ce que je vois déjà. Les deux voix que tu
            liras dans ces textes (<em>Lunæris</em> et <em>Oron</em>) sont deux façons d'entrer dans
            la même idée : l'une par l'image, l'autre par la précision.
          </p>

          <div className="about-divider" />

          <p className="about-disclaimer">
            Je ne dis pas que ces idées sont vraies. Je ne dis pas que j'y crois au sens où on croit
            à un fait. Ce sont des images que je vois — et que je peux croire, provisoirement, le
            temps de les explorer. Comme on croit à une métaphore : pas parce qu'elle est exacte,
            mais parce qu'elle éclaire quelque chose.
          </p>

          <p className="about-disclaimer">
            Ce n'est pas de la philosophie académique. Ce n'est pas de la science. C'est une façon
            de regarder — personnelle, partielle, révisable.
          </p>

          <div className="about-divider" />

          <p>
            Si une idée te résonne, c'est bien. Si elle te semble fausse ou incomplète, c'est aussi
            bien — c'est peut-être là que ça devient intéressant.
          </p>
        </div>
      </div>
    </div>
  );
}
