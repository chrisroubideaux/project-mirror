# backend/videos/services/csv_export.py

import csv
import io
from typing import List, Dict


def export_csv(
    rows: List[Dict],
    fieldnames: List[str],
) -> io.StringIO:
    """
    Generic CSV exporter.
    Returns an in-memory CSV buffer.
    """

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)

    writer.writeheader()
    for row in rows:
        writer.writerow(row)

    buffer.seek(0)
    return buffer
