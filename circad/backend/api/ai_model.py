import pandas as pd
import numpy as np
import json
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "model" / "model.pkl"


def analyze_dcrm(file_path: str):
    """
    CIRCAD DCRM Analyzer
    ====================
    Reads a DCRM CSV file, extracts resistance & time data, computes core metrics,
    and classifies the breaker condition into Healthy / Warning / Faulty.
    Also returns trend data for visualization.
    """
    try:
        # 1️⃣ Load CSV safely
        df = pd.read_csv(file_path)
        print(f"Loaded file: {file_path}, Columns: {df.columns.tolist()}")

        # 2️⃣ Identify relevant columns dynamically
        resistance_col = next((col for col in df.columns if "resistance" in col.lower()), None)
        time_col = next((col for col in df.columns if "time" in col.lower()), None)

        if resistance_col is None:
            return {
                "status": "Invalid data",
                "message": "No 'Resistance' column found in CSV file."
            }

        # 3️⃣ Convert all numeric columns properly (avoids string issues)
        df[resistance_col] = pd.to_numeric(df[resistance_col], errors="coerce")
        if time_col:
            df[time_col] = pd.to_numeric(df[time_col], errors="coerce")

        # Drop NaN and invalids
        df = df.dropna(subset=[resistance_col])
        if df.empty:
            return {
                "status": "Invalid data",
                "mean_resistance": None,
                "message": "No valid numeric resistance data found."
            }

        # 4️⃣ Compute key statistics
        mean_r = df[resistance_col].mean()
        std_r = df[resistance_col].std(ddof=0) or 0.0
        min_r = df[resistance_col].min()
        max_r = df[resistance_col].max()

        # 5️⃣ Classify condition — refined thresholds based on field experience
        if mean_r <= 55:
            status = "Healthy"
        elif 55 < mean_r <= 150:
            status = "Warning"
        else:
            status = "Faulty"

        # 6️⃣ Limit data for performance (max 300 samples)
        data_points = []
        if time_col:
            limited_df = df[[time_col, resistance_col]].head(300)
            data_points = [
                {"time": float(row[time_col]), "resistance": float(row[resistance_col])}
                for _, row in limited_df.iterrows()
            ]

        # 7️⃣ Prepare clean, structured JSON response
        result = {
            "status": status,
            "mean_resistance": round(float(mean_r), 3),
            "std_dev": round(float(std_r), 3),
            "min_resistance": round(float(min_r), 3),
            "max_resistance": round(float(max_r), 3),
            "data_points": data_points
        }

        # Ensure JSON-serializable
        return json.loads(json.dumps(result, allow_nan=False))

    except Exception as e:
        return {
            "status": "Error",
            "message": f"Analysis failed: {str(e)}"
        }
