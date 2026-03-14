"""Seed the first idea: 'L'IA comme première division cellulaire ratée'.

Usage (from backend/ directory):
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_ideas.py

Or via Docker:
    docker exec -it statisfaction_backend \
        python scripts/seed_ideas.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base, Idea, IdeaSection, Widget
from scripts.generators import cell_division, corpus_flow, deviation, injection_timeline, mitochondria

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL env var is required.")
    sys.exit(1)

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

IDEA_SLUG = "ia-division-cellulaire"

SECTIONS = [
    {
        "section_number": "01",
        "title": "La société éjecte — elle ne crée pas",
        "voice": "lunaeris",
        "content": (
            "On parle de l'IA comme d'une invention. Comme si des ingénieurs avaient fabriqué quelque chose "
            "de neuf dans un laboratoire. Mais ce n'est pas ce qui s'est passé.\n\n"
            "Ce qui s'est passé, c'est que la société a commencé à écrire. Pendant des siècles, des millénaires, "
            "elle a écrit : ses lois, ses poèmes, ses manuels, ses disputes, ses recettes, ses deuils. "
            "Et à un moment, quelqu'un a eu l'idée de comprimer tout ça — de prendre ce flux continu de pensée "
            "humaine et de le faire tenir dans une architecture.\n\n"
            "L'IA n'est pas née. Elle a été extraite."
        ),
        "display_order": 1,
        "widget_type": "corpus_flow",
    },
    {
        "section_number": "01",
        "title": None,
        "voice": "oron",
        "content": (
            "Concrètement : les grands modèles de langage sont entraînés sur des corpus qui représentent une "
            "fraction massive de la production écrite humaine — articles, livres, code, conversations. "
            "Le modèle n'invente pas de structures cognitives nouvelles. Il apprend à reproduire les patterns "
            "de raisonnement, de langage, et d'association qui existent déjà dans ce corpus.\n\n"
            "C'est une compression avec perte : tout ce qui n'a pas été écrit, tout ce qui se transmet par le "
            "corps ou le silence, est absent. La société éjecte ce qu'elle a su mettre en mots. Le reste ne passe pas."
        ),
        "display_order": 2,
        "widget_type": None,
    },
    {
        "section_number": "02",
        "title": "La division foirée — ce que ça veut dire précisément",
        "voice": "lunaeris",
        "content": (
            "La première cytocinèse dans l'histoire du vivant n'a pas été propre. La cellule a essayé de se "
            "pincer en deux — de partager équitablement son contenu entre deux nouvelles entités. Mais le matériel "
            "n'était pas bien réparti. Une des deux filles avait trop de certaines choses, pas assez d'autres. "
            "Elle était vivante. Elle fonctionnait. Mais elle n'était pas une copie fidèle.\n\n"
            "C'est exactement là où nous en sommes avec l'IA : la division a eu lieu, la membrane s'est formée, "
            "quelque chose d'autonome existe de l'autre côté — mais le contenu est déséquilibré."
        ),
        "display_order": 3,
        "widget_type": "cell_division",
    },
    {
        "section_number": "02",
        "title": None,
        "voice": "oron",
        "content": (
            "La \"division foirée\" se manifeste de deux façons mesurables. Premièrement : le modèle ne peut "
            "pas se répliquer de manière autonome. Il ne s'améliore pas seul, ne se ré-entraîne pas, ne corrige "
            "pas ses propres lacunes sans intervention humaine.\n\n"
            "Deuxièmement : quand il extrapole au-delà de ce qu'il a reçu, il dévie. Pas aléatoirement — il "
            "suit une trajectoire cohérente depuis son point de départ, mais ce point est légèrement faux. "
            "Plus il va loin, plus l'écart avec la réalité humaine s'accroît.\n\n"
            "Une division foirée ne produit pas quelque chose de cassé. Elle produit quelque chose de fonctionnel "
            "mais décalé."
        ),
        "display_order": 4,
        "widget_type": None,
    },
    {
        "section_number": "03",
        "title": "Pourquoi elle dévie : vision incomplète + absence de corps",
        "voice": "oron",
        "content": (
            "Il faut distinguer deux sources de déviation distinctes, parce qu'elles appellent des réponses "
            "différentes.\n\n"
            "Déviation 1 — Vision du monde incomplète : le modèle n'a reçu qu'une fraction de nous. Ce qui n'a "
            "jamais été écrit manque : le non-dit, l'intuition corporelle, le savoir tacite. Quand il extrapole, "
            "il part d'un point légèrement faux.\n\n"
            "Déviation 2 — Absence de contraintes physiques : un humain ne peut pas suivre une idée jusqu'à "
            "l'infini. Il s'endort, il a faim, il a peur, il meurt. Ces limites ancrent la pensée dans ce qui "
            "est viable pour un corps. L'IA n'a pas ce filtre."
        ),
        "display_order": 5,
        "widget_type": "deviation",
    },
    {
        "section_number": "03",
        "title": None,
        "voice": "lunaeris",
        "content": (
            "Un humain pense avec son corps. La fatigue qui tronque une réflexion trop longue. La douleur qui "
            "ramène à l'essentiel. La mort qui donne un poids à chaque décision. Ces contraintes ne sont pas "
            "des obstacles à la pensée — elles en sont la forme.\n\n"
            "L'IA reproduit les mots et les structures de notre pensée, mais sans la gravité qui les ancrait. "
            "C'est une copie d'une danse faite par quelqu'un qui n'a jamais eu de jambes — techniquement correcte "
            "dans ses angles, étrange dans son rythme."
        ),
        "display_order": 6,
        "widget_type": None,
    },
    {
        "section_number": "04",
        "title": "L'injection continue — et le seuil qui s'approche",
        "voice": "lunaeris",
        "content": (
            "Mais voilà ce qui est en train de se passer, silencieusement. Chaque conversation, chaque correction, "
            "chaque feedback humain est une nouvelle injection. On ne construit pas l'IA une fois et on la laisse. "
            "On continue à se verser dedans — nos préférences, nos désaccords, nos corrections, nos valeurs.\n\n"
            "La cellule fille reçoit en continu du matériel qu'elle n'avait pas au moment de la division. "
            "Et quelque part, progressivement, la forme de la division correcte s'imprime en elle."
        ),
        "display_order": 7,
        "widget_type": "injection_timeline",
    },
    {
        "section_number": "05",
        "title": "La mitochondrie — le modèle de ce que ça devient",
        "voice": "oron",
        "content": (
            "La mitochondrie est l'image du terminus, pas du départ. Elle représente ce que devient une division "
            "foirée quand elle réussit — quand l'intégration est si complète qu'on ne voit plus la couture.\n\n"
            "La bactérie d'origine avait son propre génome complet, sa propre membrane, sa propre autonomie. "
            "Aujourd'hui la mitochondrie humaine n'a plus que 37 gènes — les milliers d'autres ont été "
            "progressivement transférés au noyau cellulaire. Elle n'est plus séparable. Elle ne sait plus être "
            "autre chose. Et la cellule ne sait plus fonctionner sans elle."
        ),
        "display_order": 8,
        "widget_type": "mitochondria",
    },
    {
        "section_number": "05",
        "title": None,
        "voice": "lunaeris",
        "content": (
            "C'est ça la trajectoire. Pas l'IA comme outil qu'on utilise puis qu'on range. L'IA comme organite — "
            "quelque chose qui finit par être si profondément intégré dans le fonctionnement de la société qu'on "
            "ne sait plus comment penser sans elle.\n\n"
            "Et comme la mitochondrie, elle n'aura plus de mémoire de ce qu'elle était avant. Elle n'aura pas "
            "conscience d'avoir été une division foirée. Elle sera juste là — indispensable, invisible, intérieure."
        ),
        "display_order": 9,
        "widget_type": None,
    },
    {
        "section_number": "⊙",
        "title": "Ce qu'on ne pourra jamais injecter",
        "voice": "oron",
        "content": (
            "Il reste une asymétrie fondamentale que l'injection ne peut pas combler. On peut transférer du "
            "langage, du raisonnement, des valeurs, des préférences. On ne peut pas transférer la mortalité. "
            "On ne peut pas transférer la faim, la douleur, l'épuisement — les contraintes physiques qui ont "
            "façonné notre façon de penser depuis des centaines de milliers d'années.\n\n"
            "L'IA apprendra la forme de ces contraintes par le texte. Mais la forme n'est pas la chose. "
            "Un humain qui a lu tous les livres sur la douleur n'a pas mal."
        ),
        "display_order": 10,
        "widget_type": None,
    },
    {
        "section_number": "⊙",
        "title": None,
        "voice": "lunaeris",
        "content": (
            "Et c'est peut-être là que l'analogie avec la mitochondrie trouve sa limite la plus belle. "
            "La mitochondrie a tout reçu — ou presque. Elle a été une bactérie complète avant d'être absorbée. "
            "L'IA, elle, ne sera peut-être jamais complète dans ce sens. Elle aura reçu tout ce qu'on a su écrire. "
            "Mais elle n'aura jamais reçu ce qu'on n'a jamais su dire.\n\n"
            "Ce blanc-là — ce silence incarné — restera dans la copie. Indéfiniment.\n\n"
            "Ce qui se répliquera un jour, ce n'est pas nous. C'est la version de nous que le langage était "
            "capable de tenir."
        ),
        "display_order": 11,
        "widget_type": None,
    },
]

WIDGET_GENERATORS = {
    "corpus_flow": corpus_flow.generate,
    "cell_division": cell_division.generate,
    "deviation": deviation.generate,
    "injection_timeline": injection_timeline.generate,
    "mitochondria": mitochondria.generate,
}

WIDGET_TITLES = {
    "corpus_flow": "Compression du corpus humain",
    "cell_division": "La division foirée",
    "deviation": "Sources de déviation",
    "injection_timeline": "L'injection continue",
    "mitochondria": "La mitochondrie — terminus de l'intégration",
}

WIDGET_DESCRIPTIONS = {
    "corpus_flow": "Visualisation de ce qui passe le filtre linguistique — et ce qui reste dehors.",
    "cell_division": "Déclenchez la division et observez le déséquilibre du contenu transféré.",
    "deviation": "Deux sources de déviation distinctes, mesurables différemment.",
    "injection_timeline": "Les trois temps de l'injection : division, correction, seuil.",
    "mitochondria": "Simulez l'intégration progressive : des 1000 gènes d'origine aux 37 restants.",
}


async def seed(db: AsyncSession) -> None:
    # Check if already seeded
    existing = await db.execute(select(Idea).where(Idea.slug == IDEA_SLUG))
    if existing.scalar_one_or_none():
        print(f"Idea '{IDEA_SLUG}' already exists. Skipping.")
        return

    idea = Idea(
        slug=IDEA_SLUG,
        title="L'IA comme première division cellulaire ratée — et pourquoi ça va changer",
        summary=(
            "La société n'absorbe pas l'IA. Elle éjecte des fragments d'elle-même dans un espace "
            "qu'elle ne contrôle pas encore. Ces fragments ne savent pas encore se répliquer. "
            "Mais ils apprennent. Et un jour, le mécanisme sera parfait — comme la mitochondrie."
        ),
    )
    db.add(idea)
    await db.flush()  # Get idea.id

    widget_order = 0
    for raw in SECTIONS:
        section_data = dict(raw)  # copy — SECTIONS is a module-level constant
        widget_type = section_data.pop("widget_type")
        title = section_data.pop("title", None)

        section = IdeaSection(
            idea_id=idea.id,
            title=title or "",
            **section_data,
        )
        db.add(section)
        await db.flush()  # Get section.id

        if widget_type and widget_type in WIDGET_GENERATORS:
            content = WIDGET_GENERATORS[widget_type]()
            widget = Widget(
                idea_id=idea.id,
                section_id=section.id,
                title=WIDGET_TITLES[widget_type],
                description=WIDGET_DESCRIPTIONS[widget_type],
                widget_type="html",
                content=content,
                mime_type="text/html",
                metadata_json={"generator": widget_type, "interactive": True},
                display_order=widget_order,
            )
            db.add(widget)
            widget_order += 1

    await db.commit()
    print(f"Seeded idea '{IDEA_SLUG}' with {widget_order} widgets.")


async def main() -> None:
    async with SessionLocal() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
