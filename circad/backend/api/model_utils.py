# circad/backend/api/model_utils.py
from pathlib import Path
from joblib import load
import numpy as np

MODEL_FILE = Path(__file__).resolve().parent.parent / "data" / "model" / "contact_health.pkl"

_model_pkg = None

def load_model_package():
    global _model_pkg
    if _model_pkg is not None:
        return _model_pkg
    try:
        if MODEL_FILE.exists():
            pkg = load(MODEL_FILE)
            # expects {'model': clf, 'label_encoder': le}
            _model_pkg = pkg
            print("Loaded model package:", MODEL_FILE)
        else:
            print("Model not found at:", MODEL_FILE)
            _model_pkg = None
    except Exception as e:
        print("Failed loading model package:", e)
        _model_pkg = None
    return _model_pkg

def predict_with_confidence(features):
    """
    features: list-like numeric [mean, std, slope, min, max]
    returns: (label_string, confidence_float between 0..1) or (None, None) if no model
    """
    pkg = load_model_package()
    if not pkg:
        return None, None
    try:
        clf = pkg.get("model")
        le = pkg.get("label_encoder")
        X = np.array(features, dtype=float).reshape(1, -1)
        if hasattr(clf, "predict_proba"):
            proba = clf.predict_proba(X)[0]
            idx = int(np.argmax(proba))
            label = le.inverse_transform([idx])[0]
            confidence = float(proba[idx])
            return label, confidence
        else:
            pred = clf.predict(X)[0]
            label = le.inverse_transform([pred])[0] if le is not None else str(pred)
            return label, 1.0
    except Exception as e:
        print("Model predict error:", e)
        return None, None
