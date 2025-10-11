# circad/backend/api/ai_model.py
import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.linear_model import LinearRegression

from . import model_utils  # relative import

def compute_basic_features(df, resistance_col):
    mean_r = float(df[resistance_col].mean())
    std_r = float(df[resistance_col].std(ddof=0) if not pd.isna(df[resistance_col].std(ddof=0)) else 0.0)
    min_r = float(df[resistance_col].min())
    max_r = float(df[resistance_col].max())
    try:
        y = pd.to_numeric(df[resistance_col], errors="coerce").dropna().values
        slope = float(np.polyfit(np.arange(len(y)), y, 1)[0]) if len(y) >= 2 else 0.0
    except Exception:
        slope = 0.0
    return mean_r, std_r, min_r, max_r, slope

def forecast_mean(history):
    try:
        if not history or len(history) < 3:
            return None
        X = np.arange(len(history)).reshape(-1, 1)
        y = np.array(history, dtype=float)
        model = LinearRegression().fit(X, y)
        next_val = model.predict([[len(history)]])[0]
        return float(next_val)
    except Exception as e:
        print("Forecast failed:", e)
        return None

def analyze_dcrm(file_path: str, past_means=None):
    try:
        df = pd.read_csv(file_path)
        print(f"Loaded file: {file_path}, Columns: {df.columns.tolist()}")

        resistance_col = next((col for col in df.columns if "resistance" in col.lower()), None)
        time_col = next((col for col in df.columns if "time" in col.lower()), None)

        if resistance_col is None:
            return {"status": "Invalid data", "message": "No 'Resistance' column found"}

        df[resistance_col] = pd.to_numeric(df[resistance_col], errors="coerce")
        if time_col:
            df[time_col] = pd.to_numeric(df[time_col], errors="coerce")

        df = df.dropna(subset=[resistance_col])
        if df.empty:
            return {"status": "Invalid data", "mean_resistance": None, "message": "No numeric resistance data"}

        mean_r, std_r, min_r, max_r, slope = compute_basic_features(df, resistance_col)

        # classification thresholds (adjusted)
        if mean_r <= 55:
            status = "Healthy"
        elif 55 < mean_r <= 150:
            status = "Warning"
        else:
            status = "Faulty"

        data_points = []
        if time_col:
            limited_df = df[[time_col, resistance_col]].head(300)
            for _, row in limited_df.iterrows():
                try:
                    data_points.append({"time": float(row[time_col]), "resistance": float(row[resistance_col])})
                except Exception:
                    continue

        # ML prediction & confidence
        predicted_condition = None
        predicted_confidence = None
        try:
            features = [mean_r, std_r, slope, min_r, max_r]
            label, conf = model_utils.predict_with_confidence(features)
            if label is not None:
                predicted_condition = label
                predicted_confidence = round(float(conf), 3) if conf is not None else None
        except Exception as e:
            print("Model prediction error:", e)
            predicted_condition = None

        # Forecast
        forecast_next = None
        try:
            history = list(past_means) if past_means else []
            if history and isinstance(history, list):
                history = [float(v) for v in history if v is not None]
            history.append(mean_r)
            forecast_next = forecast_mean(history)
        except Exception as e:
            print("Forecast error:", e)
            forecast_next = None

        result = {
            "status": status,
            "mean_resistance": round(float(mean_r), 3),
            "std_dev": round(float(std_r), 3),
            "min_resistance": round(float(min_r), 3),
            "max_resistance": round(float(max_r), 3),
            "slope": round(float(slope), 6),
            "predicted_condition": predicted_condition,
            "predicted_confidence": predicted_confidence,
            "forecast_next_mean": (round(float(forecast_next), 3) if forecast_next is not None else None),
            "data_points": data_points
        }

        return json.loads(json.dumps(result, allow_nan=False))
    except Exception as e:
        return {"status": "Error", "message": f"Analysis failed: {str(e)}"}
