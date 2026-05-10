# ruff: noqa: I001  -- sys.path manipulation must precede local imports
"""Unit tests for garmin module classification logic."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from garmin import classify_run_type, classify_split
from models import UserSettings

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_split(split_type, distance_km=1.0, elevation_gain_m=5.0):
    return {
        "split_type": split_type,
        "distance_km": distance_km,
        "elevation_gain_m": elevation_gain_m,
    }


# ---------------------------------------------------------------------------
# classify_split (existing logic — regression tests)
# ---------------------------------------------------------------------------


def test_classify_split_running():
    assert classify_split(5.0) == "running"


def test_classify_split_walking():
    assert classify_split(15.0) == "walking"


def test_classify_split_fast():
    assert classify_split(3.5) == "fast"


def test_classify_split_idle():
    assert classify_split(25.0) == "idle"


def test_classify_split_none():
    assert classify_split(None) == "idle"


# ---------------------------------------------------------------------------
# classify_run_type
# ---------------------------------------------------------------------------


def test_classify_run_type_easy_default():
    """Short run with only running splits → easy."""
    splits = [make_split("running") for _ in range(4)]
    assert classify_run_type(splits) == "easy"


def test_classify_run_type_empty():
    """No splits → easy (safe default)."""
    assert classify_run_type([]) == "easy"


def test_classify_run_type_long():
    """Distance ≥ 12 km with no fast splits → long."""
    splits = [make_split("running", distance_km=2.0) for _ in range(7)]
    assert classify_run_type(splits) == "long"


def test_classify_run_type_sprints():
    """Alternating fast/idle pattern → sprints."""
    splits = [
        make_split("fast"),
        make_split("idle"),
        make_split("fast"),
        make_split("idle"),
        make_split("fast"),
    ]
    assert classify_run_type(splits) == "sprints"


def test_classify_run_type_sprints_with_walking_recovery():
    """Alternating fast/walking pattern → sprints."""
    splits = [
        make_split("fast"),
        make_split("walking"),
        make_split("fast"),
        make_split("walking"),
        make_split("fast"),
    ]
    assert classify_run_type(splits) == "sprints"


def test_classify_run_type_hills():
    """Alternating pattern with high elevation on fast splits → hills."""
    splits = [
        make_split("fast", elevation_gain_m=50.0),  # 50 m/km → above 30 m/km threshold
        make_split("idle"),
        make_split("fast", elevation_gain_m=50.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=50.0),
    ]
    assert classify_run_type(splits) == "hills"


def test_classify_run_type_hills_beats_sprints():
    """Hills takes priority over sprints when elevation threshold is met."""
    splits = [
        make_split("fast", elevation_gain_m=60.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=60.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=60.0),
    ]
    assert classify_run_type(splits) == "hills"


def test_classify_run_type_sprints_flat():
    """Same alternating pattern but low elevation → sprints, not hills."""
    splits = [
        make_split("fast", elevation_gain_m=5.0),  # only 5 m/km
        make_split("idle"),
        make_split("fast", elevation_gain_m=5.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=5.0),
    ]
    assert classify_run_type(splits) == "sprints"


def test_classify_run_type_tempo():
    """Fast splits present but no alternating recovery pattern → tempo."""
    splits = [
        make_split("running"),
        make_split("running"),
        make_split("fast"),
        make_split("fast"),
        make_split("running"),
        make_split("running"),
    ]
    assert classify_run_type(splits) == "tempo"


def test_classify_run_type_single_fast_is_tempo_not_sprints():
    """A single fast split cannot qualify as sprints (needs ≥ 2)."""
    splits = [make_split("running"), make_split("fast"), make_split("running")]
    assert classify_run_type(splits) == "tempo"


def test_classify_run_type_tempo_min_fraction():
    """Fast splits below the 15% distance fraction → not tempo."""
    # 6 × 2 km running + 1 × 0.5 km fast = 12.5 km total, 4% fast → long
    splits = [make_split("running", distance_km=2.0) for _ in range(6)]
    splits.append(make_split("fast", distance_km=0.5))
    assert classify_run_type(splits) == "long"


def test_classify_run_type_intensity_over_long():
    """A long-distance interval session → sprints (intensity beats long)."""
    splits = []
    for _ in range(5):
        splits.append(make_split("fast", distance_km=1.5))
        splits.append(make_split("idle", distance_km=0.5))
    # total distance = 5 × 2 km = 10 km < 12 km, but let's make it > 12
    # 8 × (fast 1.5 + idle 0.5) = 16 km
    splits = []
    for _ in range(8):
        splits.append(make_split("fast", distance_km=1.5))
        splits.append(make_split("idle", distance_km=0.5))
    assert classify_run_type(splits) == "sprints"


def test_classify_run_type_none_split_type_ignored():
    """Splits with split_type=None are filtered out before classification."""
    splits = [
        {"split_type": None, "distance_km": 1.0, "elevation_gain_m": 5.0},
        make_split("running"),
        make_split("running"),
    ]
    assert classify_run_type(splits) == "easy"


def test_classify_run_type_all_none():
    """All splits with None type → easy."""
    splits = [
        {"split_type": None, "distance_km": 1.0, "elevation_gain_m": 5.0}
        for _ in range(5)
    ]
    assert classify_run_type(splits) == "easy"


# ---------------------------------------------------------------------------
# classify_split with custom UserSettings
# ---------------------------------------------------------------------------


def test_classify_split_custom_fast_threshold():
    """With pace_fast_max_min_km=5.0, pace 4.5 should be classified as fast."""
    settings = UserSettings(pace_fast_max_min_km=5.0)
    assert classify_split(4.5, settings=settings) == "fast"


def test_classify_split_custom_fast_threshold_default_still_running():
    """With default settings, pace 4.5 is still running (threshold is 4.0)."""
    assert classify_split(4.5) == "running"


def test_classify_split_custom_walking_threshold():
    """With pace_walking_min_km=8.0, pace 9.0 should be walking."""
    settings = UserSettings(pace_walking_min_km=8.0)
    assert classify_split(9.0, settings=settings) == "walking"


# ---------------------------------------------------------------------------
# classify_run_type with custom UserSettings
# ---------------------------------------------------------------------------


def test_classify_run_type_custom_long_threshold():
    """With long_run_min_km=15.0, a 12km easy run stays 'easy'."""
    settings = UserSettings(long_run_min_km=15.0)
    splits = [make_split("running", distance_km=2.0) for _ in range(6)]  # 12 km
    assert classify_run_type(splits, settings=settings) == "easy"


def test_classify_run_type_custom_long_threshold_qualifies():
    """With long_run_min_km=15.0, a 16km run is 'long'."""
    settings = UserSettings(long_run_min_km=15.0)
    splits = [make_split("running", distance_km=2.0) for _ in range(8)]  # 16 km
    assert classify_run_type(splits, settings=settings) == "long"


def test_classify_run_type_custom_tempo_fraction():
    """With tempo_min_fast_fraction=0.05, even a small fast portion qualifies."""
    settings = UserSettings(tempo_min_fast_fraction=0.05)
    # 1 fast km out of 10 total = 10% > 5%
    splits = [make_split("running", distance_km=1.0) for _ in range(9)]
    splits.append(make_split("fast", distance_km=1.0))
    assert classify_run_type(splits, settings=settings) == "tempo"


def test_classify_run_type_custom_hills_threshold():
    """hills_elev_per_km_threshold=80.0: 50 m/km fast splits → sprints not hills."""
    settings = UserSettings(hills_elev_per_km_threshold=80.0)
    splits = [
        make_split("fast", elevation_gain_m=50.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=50.0),
        make_split("idle"),
        make_split("fast", elevation_gain_m=50.0),
    ]
    assert classify_run_type(splits, settings=settings) == "sprints"
