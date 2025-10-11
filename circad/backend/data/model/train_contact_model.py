import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from joblib import dump

OUT_DIR = Path(__file__).resolve().parent
TRAIN_DIR = OUT_DIR / "training_data"
MODEL_FILE = OUT_DIR / "contact_health.pkl"
TRAIN_DIR.mkdir(parents=True, exist_ok=True)

def make_waveform(n=200, base=50, slope=0.0, noise=1.0, spikes=None):
    t = np.linspace(0, 20, n)
    r = base + slope * np.arange(n) + np.random.normal(0, noise, n)
    if spikes:
        for idx, mag in spikes:
            if 0 <= idx < n:
                r[idx] += mag
    return pd.DataFrame({"Time (ms)": t, "Resistance (µΩ)": r})

# === synthetic data ===
classes = {
    "Healthy": {"base": 45, "slope": 0.02, "noise": 0.5},
    "Early-Degradation": {"base": 60, "slope": 0.15, "noise": 1.2},
    "Faulty": {"base": 180, "slope": 0.5, "noise": 3.0},
}

for label, params in classes.items():
    for i in range(100):
        df = make_waveform(
            n=200,
            base=params["base"] * (1 + np.random.normal(0, 0.02)),
            slope=params["slope"] * (1 + np.random.normal(0, 0.1)),
            noise=params["noise"],
            spikes=[(np.random.randint(10, 190), np.random.uniform(10, 80))]
            if label != "Healthy" and np.random.rand() < 0.3 else None
        )
        df.to_csv(TRAIN_DIR / f"{label.lower()}_{i:03d}.csv", index=False)

# === feature extraction ===
def extract(df):
    c = next(c for c in df.columns if "resistance" in c.lower())
    arr = pd.to_numeric(df[c], errors="coerce").dropna().values
    mean, std, slope = arr.mean(), arr.std(), np.polyfit(np.arange(len(arr)), arr, 1)[0]
    return [mean, std, slope, arr.min(), arr.max()]

X, y = [], []
for csv in TRAIN_DIR.glob("*.csv"):
    df = pd.read_csv(csv)
    X.append(extract(df))
    y.append(csv.stem.split("_")[0].capitalize())

le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.2, random_state=42)
clf = RandomForestClassifier(n_estimators=200, random_state=42)
clf.fit(X_train, y_train)
print("Training complete. Accuracy:", clf.score(X_test, y_test))

dump({"model": clf, "label_encoder": le}, MODEL_FILE)
print("✅ Model saved to", MODEL_FILE)
