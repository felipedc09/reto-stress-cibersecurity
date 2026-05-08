#!/usr/bin/env python3
"""Build aggregated artifacts for one or more Socrata datasets.

This script is the first implementation step for the multi-dataset pipeline.
It generates:
- Raw parquet snapshots per dataset
- Aggregated parquet and JSON outputs for dashboard consumption
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import duckdb


def load_config(config_path: Path) -> dict[str, Any]:
    return json.loads(config_path.read_text(encoding="utf-8"))


def dataset_csv_url(domain: str, resource_id: str) -> str:
    token = os.environ.get("SOCRATA_APP_TOKEN", "").strip()
    base = f"https://{domain}/api/views/{resource_id}/rows.csv?accessType=DOWNLOAD"
    if not token:
        return base
    return f"{base}&$$app_token={token}"


def build_dataset(con: duckdb.DuckDBPyConnection, dataset: dict[str, Any], out_dir: Path) -> None:
    dataset_id = dataset["id"]
    resource_id = dataset["resourceId"]
    domain = dataset["domain"]

    raw_dir = out_dir / "raw"
    agg_dir = out_dir / "aggregates"
    raw_dir.mkdir(parents=True, exist_ok=True)
    agg_dir.mkdir(parents=True, exist_ok=True)

    source_url = dataset_csv_url(domain, resource_id)
    table_name = f"src_{dataset_id.replace('-', '_')}"
    agg_table_name = f"agg_{dataset_id.replace('-', '_')}"

    print(f"[INFO] Building dataset: {dataset_id}")
    print(f"[INFO] Source: {source_url}")

    con.execute(
        f"""
        CREATE OR REPLACE TABLE {table_name} AS
        SELECT *
        FROM read_csv_auto('{source_url}', header=true, all_varchar=true, ignore_errors=true);
        """
    )

    raw_parquet = raw_dir / f"{dataset_id}.parquet"
    con.execute(
        f"COPY {table_name} TO '{raw_parquet.as_posix()}' (FORMAT PARQUET, COMPRESSION ZSTD)"
    )

    dimensions = dataset["analytics"]["dimensions"]
    metrics = dataset["analytics"]["metrics"]
    select_expr = ",\n            ".join([*dimensions, *metrics])
    group_by_expr = ", ".join(dimensions)

    con.execute(
        f"""
        CREATE OR REPLACE TABLE {agg_table_name} AS
        SELECT
            {select_expr}
        FROM {table_name}
        GROUP BY {group_by_expr};
        """
    )

    agg_parquet = agg_dir / f"{dataset_id}-agg.parquet"
    con.execute(
        f"COPY {agg_table_name} TO '{agg_parquet.as_posix()}' (FORMAT PARQUET, COMPRESSION ZSTD)"
    )

    agg_json = agg_dir / f"{dataset_id}-agg.json"
    con.execute(
        f"COPY (SELECT * FROM {agg_table_name}) TO '{agg_json.as_posix()}' (FORMAT JSON, ARRAY true)"
    )

    count_raw = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
    count_agg = con.execute(f"SELECT COUNT(*) FROM {agg_table_name}").fetchone()[0]
    print(f"[OK] {dataset_id}: raw={count_raw} rows, agg={count_agg} rows")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build aggregated dashboard artifacts")
    parser.add_argument(
        "--config",
        default="config/datasets.json",
        help="Path to dataset configuration JSON",
    )
    parser.add_argument(
        "--out",
        default="data",
        help="Output directory for parquet/json artifacts",
    )
    parser.add_argument(
        "--dataset",
        default=None,
        help="Optional dataset id to process only one dataset",
    )
    args = parser.parse_args()

    config_path = Path(args.config)
    out_dir = Path(args.out)

    config = load_config(config_path)
    datasets = [d for d in config["datasets"] if d.get("enabled", True)]

    if args.dataset:
        datasets = [d for d in datasets if d["id"] == args.dataset]
        if not datasets:
            raise SystemExit(f"Dataset '{args.dataset}' not found or not enabled")

    con = duckdb.connect()
    for ds in datasets:
        build_dataset(con, ds, out_dir)

    print("[DONE] Artifacts generated successfully")


if __name__ == "__main__":
    main()
