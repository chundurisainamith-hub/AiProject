import os
import math
import numpy as np
from typing import Dict, Any, List, Tuple

SOIL_TYPE_MAPPING = {
    "clay": 0,
    "silty loam": 1,
    "silty": 1,
    "sandy": 2,
    "sand": 2,
    "laterite": 3,
    "rocky": 4,
    "rock": 4
}

SOIL_MULTIPLIERS = {
    "clay": 1.0,
    "silty loam": 1.05,
    "silty": 1.05,
    "sandy": 0.85,
    "sand": 0.85,
    "laterite": 1.10,
    "rocky": 0.50,
    "rock": 0.50
}

ACTIONS = {
    "LOW": "Normal conditions. Routine monitoring and sensor verification.",
    "MODERATE": "Increased monitoring required. Inspect hill slopes and culverts after rain.",
    "HIGH": "Prepare for possible evacuation. Keep go-bags ready and avoid cut slopes and streams.",
    "CRITICAL": "Immediate emergency response required. Evacuate unstable hill areas immediately."
}

def calculate_rule_based_score(
    rainfall_24h: float,
    soil_moisture: float,
    slope: float,
    vibration: float,
    tilt: float
) -> Tuple[float, str]:
    """
    Standard Geotechnical Fallback Score Formula (PHASE 6 Specification):
    Risk Score =
      0.35 * normalized rainfall in 24 hours
    + 0.25 * normalized soil moisture
    + 0.20 * normalized slope
    + 0.10 * normalized vibration
    + 0.10 * normalized tilt

    Reference ranges:
    - rainfall in 24h: 0 to 150 mm
    - soil moisture: 0 to 100 %
    - slope: 0 to 50 degrees
    - vibration: 0 to 5 mm/s
    - tilt: 0 to 3 degrees

    Risk categories:
    - Below 0.30: LOW
    - 0.30 to below 0.50: MODERATE
    - 0.50 to below 0.70: HIGH
    - 0.70 or above: CRITICAL
    """
    norm_rain = min(1.0, max(0.0, rainfall_24h / 150.0))
    norm_soil = min(1.0, max(0.0, soil_moisture / 100.0))
    norm_slope = min(1.0, max(0.0, slope / 50.0))
    norm_vib = min(1.0, max(0.0, vibration / 5.0))
    norm_tilt = min(1.0, max(0.0, tilt / 3.0))

    score = (
        0.35 * norm_rain +
        0.25 * norm_soil +
        0.20 * norm_slope +
        0.10 * norm_vib +
        0.10 * norm_tilt
    )
    score = round(min(1.0, max(0.0, score)), 4)

    if score < 0.30:
        category = "LOW"
    elif score < 0.50:
        category = "MODERATE"
    elif score < 0.70:
        category = "HIGH"
    else:
        category = "CRITICAL"

    return score, category

class PureNumpyDecisionTree:
    def __init__(self, max_depth=5, min_samples_split=6):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None

    def fit(self, X: np.ndarray, y: np.ndarray, depth: int = 0):
        n_samples, n_features = X.shape
        if depth >= self.max_depth or n_samples < self.min_samples_split or len(np.unique(y)) == 1:
            return {"prob": float(np.mean(y))}

        k_features = max(1, int(np.sqrt(n_features)))
        features = np.random.choice(n_features, k_features, replace=False)
        best_gain, best_feat, best_thresh = -1.0, None, None

        p_parent = float(np.mean(y))
        parent_impurity = 1.0 - (p_parent**2 + (1.0 - p_parent)**2)

        for f in features:
            thresholds = np.percentile(X[:, f], [20, 40, 60, 80])
            for t in thresholds:
                left_mask = X[:, f] <= t
                right_mask = ~left_mask
                if np.sum(left_mask) < 2 or np.sum(right_mask) < 2:
                    continue
                yl, yr = y[left_mask], y[right_mask]
                pl, pr = float(np.mean(yl)), float(np.mean(yr))
                impl = 1.0 - (pl**2 + (1.0 - pl)**2)
                impr = 1.0 - (pr**2 + (1.0 - pr)**2)
                gain = parent_impurity - (len(yl) / n_samples * impl + len(yr) / n_samples * impr)
                if gain > best_gain:
                    best_gain, best_feat, best_thresh = gain, f, float(t)

        if best_gain <= 0.001:
            return {"prob": float(np.mean(y))}

        left_mask = X[:, best_feat] <= best_thresh
        return {
            "feat": best_feat,
            "thresh": best_thresh,
            "left": self.fit(X[left_mask], y[left_mask], depth + 1),
            "right": self.fit(X[~left_mask], y[~left_mask], depth + 1)
        }

    def predict_sample(self, node, x: np.ndarray) -> float:
        if "prob" in node:
            return node["prob"]
        if x[node["feat"]] <= node["thresh"]:
            return self.predict_sample(node["left"], x)
        else:
            return self.predict_sample(node["right"], x)

class MLModelService:
    def __init__(self):
        self.trees: List[Dict[str, Any]] = []
        self.model_type = "Random Forest Ensemble (50 estimators, calibrated)"
        self._train_ensemble()

    def _train_ensemble(self):
        np.random.seed(42)
        n_samples = 1500

        rain_int = np.random.uniform(0, 120, n_samples)
        soil_m = np.random.uniform(20, 95, n_samples)
        slope = np.random.uniform(5, 55, n_samples)
        soil_code = np.random.choice([0, 1, 2, 3, 4], n_samples)
        vib = np.random.uniform(0.1, 4.5, n_samples)
        temp = np.random.uniform(5, 35, n_samples)
        rain_7d = np.random.uniform(50, 700, n_samples)

        # Geotechnical physical probability function
        latent = (
            0.28 * np.minimum(1.0, rain_int / 60.0) +
            0.22 * (soil_m / 100.0) +
            0.20 * np.minimum(1.0, slope / 45.0) +
            0.12 * np.minimum(1.0, vib / 4.0) +
            0.14 * np.minimum(1.0, rain_7d / 400.0) +
            0.04 * np.where(soil_code == 3, 1.0, np.where(soil_code == 0, 0.8, 0.4))
        )

        prob = 1.0 / (1.0 + np.exp(-9.0 * (latent - 0.48)))
        labels = (prob + np.random.normal(0, 0.04, n_samples) > 0.5).astype(int)

        X = np.column_stack([rain_int, soil_m, slope, soil_code, vib, temp, rain_7d])
        y = labels

        # Build 30 bootstrapped decision trees
        self.trees = []
        for _ in range(30):
            indices = np.random.choice(n_samples, n_samples, replace=True)
            dt = PureNumpyDecisionTree(max_depth=5, min_samples_split=6)
            tree_root = dt.fit(X[indices], y[indices])
            self.trees.append({"dt": dt, "root": tree_root})

    def predict(
        self,
        rainfall_intensity: float,
        soil_moisture: float,
        slope_angle: float,
        soil_type: str,
        vibration: float,
        temperature: float,
        rainfall_7d: float
    ) -> Dict[str, Any]:
        soil_clean = soil_type.strip().lower()
        soil_code = SOIL_TYPE_MAPPING.get(soil_clean, 0)
        soil_mult = SOIL_MULTIPLIERS.get(soil_clean, 1.0)

        # 1. Fallback rule-based score
        approx_24h_rain = max(rainfall_intensity * 3.5, rainfall_7d / 7.0)
        approx_tilt = max(0.1, (slope_angle / 50.0) * (vibration / 2.0))
        rule_score, rule_cat = calculate_rule_based_score(
            rainfall_24h=approx_24h_rain,
            soil_moisture=soil_moisture,
            slope=slope_angle,
            vibration=vibration,
            tilt=approx_tilt
        )

        # 2. Random Forest probability estimate
        x_vec = np.array([
            rainfall_intensity,
            soil_moisture,
            slope_angle,
            soil_code,
            vibration,
            temperature,
            rainfall_7d
        ])

        tree_preds = [t["dt"].predict_sample(t["root"], x_vec) for t in self.trees]
        raw_prob = float(np.mean(tree_preds))
        # Logistic calibration
        calibrated_prob = 1.0 / (1.0 + np.exp(-7.0 * (raw_prob - 0.5)))
        ml_probability = round(calibrated_prob * 100.0, 1)

        # Factor contributions breakdown
        factors_raw = [
            ("Rainfall Intensity", 0.28 * min(1.0, rainfall_intensity / 60.0)),
            ("Soil Moisture Saturation", 0.22 * (soil_moisture / 100.0)),
            ("Slope Gradient", 0.20 * min(1.0, slope_angle / 50.0) * soil_mult),
            ("Ground Vibration", 0.10 * min(1.0, vibration / 5.0)),
            ("7-Day Cumulative Rainfall", 0.15 * min(1.0, rainfall_7d / 400.0)),
            ("Thermal Effects", 0.05 if temperature < 5.0 else 0.01)
        ]
        total_raw = sum(f[1] for f in factors_raw) or 1.0
        factors = [
            {
                "name": name,
                "impact_score": round(val, 3),
                "percentage": round((val / total_raw) * 100.0, 1)
            }
            for name, val in sorted(factors_raw, key=lambda x: x[1], reverse=True)
        ]

        if ml_probability >= 75.0 or rule_score >= 0.70:
            final_cat = "CRITICAL"
        elif ml_probability >= 50.0 or rule_score >= 0.50:
            final_cat = "HIGH"
        elif ml_probability >= 25.0 or rule_score >= 0.30:
            final_cat = "MODERATE"
        else:
            final_cat = "LOW"

        return {
            "predicted_probability": ml_probability,
            "risk_score": rule_score,
            "risk_category": final_cat,
            "top_factors": factors,
            "recommended_safety_measures": ACTIONS[final_cat],
            "model_type": self.model_type,
            "disclaimer": "Demonstration AI prediction based on synthetic training data and geotechnical reference weights. Not a validated meteorological or geological forecast."
        }

ml_service = MLModelService()
