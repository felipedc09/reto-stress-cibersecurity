#!/usr/bin/env python3
"""Smoke tests for multi-dataset project scaffolding.

These tests avoid heavy data downloads and validate the project wiring.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate_dataset_config() -> None:
    config_path = ROOT / "config" / "datasets.json"
    assert_true(config_path.exists(), "Missing config/datasets.json")

    config = json.loads(config_path.read_text(encoding="utf-8"))
    assert_true(isinstance(config.get("datasets"), list), "datasets must be a list")
    assert_true(len(config["datasets"]) >= 2, "Expected at least 2 datasets")

    required_fields = {"id", "name", "provider", "domain", "resourceId", "enabled", "analytics"}
    required_analytics = {"dimensions", "metrics"}

    for dataset in config["datasets"]:
        missing = required_fields.difference(dataset.keys())
        assert_true(not missing, f"Dataset {dataset.get('id')} missing fields: {sorted(missing)}")

        analytics = dataset.get("analytics", {})
        missing_analytics = required_analytics.difference(analytics.keys())
        assert_true(not missing_analytics, f"Dataset {dataset.get('id')} missing analytics fields: {sorted(missing_analytics)}")
        assert_true(len(analytics["dimensions"]) > 0, f"Dataset {dataset.get('id')} has empty dimensions")
        assert_true(len(analytics["metrics"]) > 0, f"Dataset {dataset.get('id')} has empty metrics")



def validate_runtime_files() -> None:
    required_files = [
        ROOT / "dashboard.html",
        ROOT / "dashboard-app.js",
        ROOT / "scripts" / "pipeline" / "build_aggregates.py",
        ROOT / "workers" / "api" / "worker.js",
        ROOT / "workers" / "api" / "wrangler.toml",
    ]
    for file_path in required_files:
        assert_true(file_path.exists(), f"Missing required file: {file_path}")



def main() -> None:
    validate_dataset_config()
    validate_runtime_files()
    print("[OK] Smoke tests passed")


if __name__ == "__main__":
    main()
