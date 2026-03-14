# inject-idea

Inject a new philosophical idea into the Statisfaction ideas section.

## What this skill does

1. Takes an idea (essay text, title, summary) as input
2. Breaks it into sections with voice attribution (lunaeris / oron)
3. Generates 3–5 interactive HTML widgets using Python scripts
4. Adds a new generator file in `backend/scripts/generators/`
5. Adds a new seed entry in `backend/scripts/seed_ideas.py` (or creates a new seed script)
6. Registers the idea in the DB via the seed script

## Usage

```
/inject-idea
```

Then provide the full idea text when prompted. Claude will:
- Parse the essay structure (numbered sections, voice labels, conclusion)
- Propose widget concepts for each key section
- Generate the widget HTML in `backend/scripts/generators/<slug>.py`
- Create `backend/scripts/seed_<slug>.py` with the full seed
- Verify the build still passes

## Widget types available

| Type | When to use |
|------|-------------|
| `html` | Interactive widget with JS (sliders, animations, click events) |
| `animated_svg` | Pure CSS animation, no interactivity needed |
| `chart_svg` | Pre-rendered chart from matplotlib (run once, store SVG) |
| `video` | Pre-rendered animation via ffmpeg or matplotlib.animation |

## Generating a chart_svg widget with matplotlib

```python
# backend/scripts/generators/my_chart.py
import io
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

def generate() -> str:
    fig, ax = plt.subplots(figsize=(6, 3))
    ax.set_facecolor('#111120')
    fig.patch.set_facecolor('#0d0d17')
    # ... plot your data ...
    buf = io.StringIO()
    fig.savefig(buf, format='svg', bbox_inches='tight')
    plt.close(fig)
    return buf.getvalue()
```

## Generating a video widget with ffmpeg

```python
# backend/scripts/generators/my_video.py
import subprocess, tempfile, os, base64

def generate() -> str:
    """Returns a base64 data URL for an MP4 video."""
    with tempfile.TemporaryDirectory() as tmp:
        # Generate frames (e.g. with matplotlib)
        # ...
        out = os.path.join(tmp, 'out.mp4')
        subprocess.run([
            'ffmpeg', '-framerate', '24',
            '-i', os.path.join(tmp, 'frame_%04d.png'),
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out
        ], check=True)
        with open(out, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode()
        return f'data:video/mp4;base64,{b64}'
```

Then in the seed script, store as `widget_type="video"` and use `content=generate()`.

## Seed script template

```python
# backend/scripts/seed_<slug>.py
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.models import Idea, IdeaSection, Widget
from scripts.generators import my_widget

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(DATABASE_URL)
Session = async_sessionmaker(engine, expire_on_commit=False)

async def seed(db: AsyncSession) -> None:
    existing = await db.execute(select(Idea).where(Idea.slug == "my-slug"))
    if existing.scalar_one_or_none():
        print("Already seeded.")
        return

    idea = Idea(slug="my-slug", title="...", summary="...")
    db.add(idea)
    await db.flush()

    section = IdeaSection(
        idea_id=idea.id, section_number="01",
        title="...", voice="lunaeris",
        content="...", display_order=1
    )
    db.add(section)
    await db.flush()

    widget = Widget(
        idea_id=idea.id, section_id=section.id,
        title="...", widget_type="html",
        content=my_widget.generate(),
        mime_type="text/html", display_order=0
    )
    db.add(widget)
    await db.commit()
    print("Seeded.")

async def main():
    async with Session() as db:
        await seed(db)
    await engine.dispose()

asyncio.run(main())
```

## Running the seed

```bash
# Via Docker
docker exec statisfaction_backend \
  env DATABASE_URL=$DATABASE_URL \
  python scripts/seed_ideas.py

# Locally (from backend/ directory)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db \
  python scripts/seed_ideas.py
```

## Voice guide

| Voice | Style | Visual treatment |
|-------|-------|-----------------|
| `lunaeris` | Poetic, metaphorical, italic | Orange left border |
| `oron` | Analytical, precise, factual | Blue-grey left border |

Sections can have multiple paragraphs separated by blank lines. Each paragraph becomes a `<p>` element.
