# circad/backend/api/ai_model.py
import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.linear_model import LinearRegression

from . import model_utils
from .alerts import send_alert_email
import logging

logger = logging.getLogger(__name__)

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

def compute_feature_importance_from_model(pkg, features_array):
    """
    A simple fallback: if model has coef_ (linear), use abs(coef); otherwise
    return heuristic importances based on variance.
    features_array: 1D list or numpy array of shape (n_features,)
    """
    try:
        clf = pkg.get("model")
        if clf is None:
            return None
        if hasattr(clf, "coef_"):
            coefs = np.abs(np.array(clf.coef_).reshape(-1))
            norm = coefs / coefs.sum() if coefs.sum() > 0 else np.ones_like(coefs) / len(coefs)
            return norm.tolist()
        # fallback: importance proportional to feature magnitude
        arr = np.abs(np.array(features_array, dtype=float))
        s = arr.sum() if arr.sum() > 0 else 1.0
        return (arr / s).tolist()
    except Exception as e:
        logger.exception("Feature importance error: %s", e)
        return None

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
        logger.exception("Forecast failed: %s", e)
        return None

def analyze_dcrm(file_path: str, past_means=None, alert_recipients=None, ml_confidence_threshold=0.6):
    """
    Analyze DCRM file and return structured JSON.
      - alert_recipients: list of emails; if forecast crosses threshold, will send alert
      - ml_confidence_threshold: only report predicted_condition if confidence >= threshold
    """
    try:
        df = pd.read_csv(file_path)
        logger.info("Loaded file: %s, columns=%s", file_path, df.columns.tolist())
    except Exception as e:
        logger.exception("Failed to read CSV %s: %s", file_path, e)
        return {"status": "Invalid data", "message": "Could not read CSV"}

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

    # classification thresholds (same as earlier)
    if mean_r <= 55:
        status = "Healthy"
    elif 55 < mean_r <= 150:
        status = "Warning"
    else:
        status = "Faulty"

    # gather data points for chart
    data_points = []
    if time_col:
        limited_df = df[[time_col, resistance_col]].head(300)
        for _, row in limited_df.iterrows():
            try:
                data_points.append({"time": float(row[time_col]), "resistance": float(row[resistance_col])})
            except Exception:
                continue
    else:
        # if no time column, use index as time
        limited = df[resistance_col].head(300)
        for i, val in enumerate(limited):
            try:
                data_points.append({"time": float(i), "resistance": float(val)})
            except Exception:
                continue

    # ML prediction & confidence (gated)
    predicted_condition = None
    predicted_confidence = None
    feature_importance = None
    model_metadata = None

    try:
        features = [mean_r, std_r, slope, min_r, max_r]
        pkg = model_utils.load_model_package()
        if pkg:
            label, conf = model_utils.predict_with_confidence(features)
            model_metadata = {
                "model_name": getattr(pkg.get("meta", {}), "get", lambda k, d=None: pkg.get(k, None))("name", None) if isinstance(pkg, dict) else None
            }
            # compute feature importance if possible
            fi = compute_feature_importance_from_model(pkg, features)
            if fi:
                feature_importance = {
                    "feature_names": ["mean", "std", "slope", "min", "max"],
                    "importances": fi
                }

            if label is not None and conf is not None:
                predicted_confidence = round(float(conf), 4)
                if predicted_confidence >= float(ml_confidence_threshold):
                    predicted_condition = label
                else:
                    # low confidence, don't surface as decision, but provide confidence value
                    predicted_condition = None
        else:
            logger.debug("No ML package loaded; skipping ML prediction.")
    except Exception as e:
        logger.exception("Model prediction error: %s", e)

    # Forecast using past means (if provided), including this mean
    forecast_next = None
    try:
        history = list(past_means) if past_means else []
        if history and isinstance(history, list):
            history = [float(v) for v in history if v is not None]
        history.append(mean_r)
        forecast_next = forecast_mean(history)
    except Exception as e:
        logger.exception("Forecast error: %s", e)

    result = {
        "status": status,
        "mean_resistance": round(float(mean_r), 3),
        "std_dev": round(float(std_r), 3),
        "min_resistance": round(float(min_r), 3),
        "max_resistance": round(float(max_r), 3),
        "slope": round(float(slope), 6),
        "predicted_condition": predicted_condition,
        "predicted_confidence": predicted_confidence,
        "feature_importance": feature_importance,
        "model_metadata": model_metadata,
        "forecast_next_mean": (round(float(forecast_next), 3) if forecast_next is not None else None),
        "data_points": data_points
    }

    # Optional: if forecast_next is dangerously high, send alert
    try:
        if forecast_next is not None and forecast_next > 150:  # threshold can be moved to settings
            if alert_recipients:
                subject = "CIRCAD alert: forecasted resistance exceeds threshold"
                body = f"Forecast next mean: {forecast_next} µΩ (analysis file: {Path(file_path).name})"
                send_alert_email(alert_recipients, subject, body)
    except Exception as e:
        logger.exception("Failed to send alert: %s", e)

    return json.loads(json.dumps(result, allow_nan=False))
