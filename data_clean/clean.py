import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# Define file names
INPUT_CSV = "Cloud_Anomaly_Dataset.csv"
OUTPUT_CSV = "modified_web_twin_telemetry.csv"

# ==========================================
# 1. READ YOUR DOWNLOADED KAGGLE DATASET
# ==========================================
if not os.path.exists(INPUT_CSV):
    print(f"Error: Could not find '{INPUT_CSV}' in this folder.")
    print("Please make sure the downloaded Kaggle CSV file is renamed exactly to 'cloud_anomaly_data.csv' and placed inside C:\\Users\\Amit Kumar\\Downloads\\data_clean")
    exit()

print(f"Ingesting real data from '{INPUT_CSV}'...")
df = pd.read_csv(INPUT_CSV)

# Let's inspect the current column names to prevent errors
print("Original columns detected:", list(df.columns))

# Force lowercase columns to avoid matching issues
df.columns = df.columns.str.lower()

# Find the label/target column (usually 'anomaly_status' or 'anomaly')
# Find the label/target column (usually 'anomaly_status' or 'anomaly')
target_col = None
for col in ['anomaly status', 'anomaly_status', 'anomaly', 'label', 'status']:

    if col in df.columns:
        target_col = col
        break

if not target_col:
    print("Error: Could not automatically find the anomaly label column.")
    print("Please check your CSV columns and update the script with the exact name.")
    exit()

# Ensure timestamp is parsed properly
timestamp_col = 'timestamp' if 'timestamp' in df.columns else df.columns[0]
df[timestamp_col] = pd.to_datetime(df[timestamp_col])

# ==========================================
# 2. DATA CLEANING & REBALANCING
# ==========================================
print("Dropping metadata, strings, and zero-variance noise features...")
# Keep only numeric telemetry features + timestamp + target
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
if timestamp_col not in numeric_cols:
    cols_to_keep = [timestamp_col] + numeric_cols
else:
    cols_to_keep = numeric_cols

df = df[cols_to_keep]

# Drop any columns that are entirely empty or have identical constant values everywhere
df = df.loc[:, df.nunique() > 1]

# Sort chronologically to safely compute time windows
df = df.sort_values(by=timestamp_col).reset_index(drop=True)

# ==========================================
# 3. WEB-SPECIFIC DATA AUGMENTATION
# ==========================================
print("Injecting web twin metrics (HTTP Error Spikes & Traffic Accelerations)...")
np.random.seed(42)

# Create baseline metrics
df["http_5xx_rate"] = np.random.uniform(0, 2, size=len(df))

# Dynamically derive realistic web requests (RPS) using an existing traffic metric if present
traffic_base = 'network_traffic' if 'network_traffic' in df.columns else df.select_dtypes(include=[np.number]).columns[0]
df["traffic_rps"] = df[traffic_base] * 2.5        

# Align web anomalies with system failures
crash_mask = df[target_col] == 1
if crash_mask.sum() > 0:
    df.loc[crash_mask, "http_5xx_rate"] = np.random.uniform(25, 80, size=crash_mask.sum())
    df.loc[crash_mask, "traffic_rps"] = df.loc[crash_mask, "traffic_rps"] * 4.0
else:
    print("Warning: No anomaly rows (value=1) were found in the dataset to augment.")

# ==========================================
# 4. TIME-SERIES FEATURE ENGINEERING (For XGBoost)
# ==========================================
print("Engineering rolling slopes and sequential lag window features...")

# Locate core columns dynamically for lag operations
cpu_base = 'cpu_usage' if 'cpu_usage' in df.columns else df.select_dtypes(include=[np.number]).columns[0]
mem_base = 'memory_usage' if 'memory_usage' in df.columns else df.select_dtypes(include=[np.number]).columns[0]


# Create Lags (Looking back into previous time steps)
df["cpu_lag_1"] = df[cpu_base].shift(1)
df["cpu_lag_3"] = df[cpu_base].shift(3)
df["mem_lag_1"] = df[mem_base].shift(1)

# Create Rolling Windows & Velocities (Rate of Change)
df["ram_velocity"] = df[mem_base].diff(periods=1)
df["cpu_rolling_mean_5"] = df[cpu_base].rolling(window=5).mean()
df["http_error_acceleration"] = df["http_5xx_rate"].diff(periods=1)

# Drop rows that contain NaN values due to lag shifts
df = df.dropna().reset_index(drop=True)

# Save intermediate modified clean CSV
df.to_csv(OUTPUT_CSV, index=False)
print(f"Modified intermediate CSV saved to '{OUTPUT_CSV}'")

# ==========================================
# 5. SPLIT & PICKLE EXPORT (.pkl)
# ==========================================
print("Splitting data and serializing ready-made files to .pkl binaries...")

# Drop timestamps from training matrices
X = df.drop(columns=[timestamp_col, target_col])
y = df[target_col]

# Sequential train-test split for time-series context integrity
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, shuffle=False)

# Bundle into dictionary payloads
training_payload = {"X_train": X_train, "y_train": y_train}
validation_payload = {"X_val": X_val, "y_val": y_val}

with open("train_dataset.pkl", "wb") as f:
    pickle.dump(training_payload, f)

with open("val_dataset.pkl", "wb") as f:
    pickle.dump(validation_payload, f)

print("Data pipeline completed successfully!")
print("   -> 'train_dataset.pkl' and 'val_dataset.pkl' are created and ready for your AI Developer.")
