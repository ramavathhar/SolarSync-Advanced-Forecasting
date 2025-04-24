import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Ensure Assets Directory Exists
if not os.path.exists('assets'):
    os.makedirs('assets')

# Load & Preprocess Data
gen_df = pd.read_csv("data/Plant_1_Generation_Data.csv")
sensor_df = pd.read_csv("data/Plant_1_Weather_Sensor_Data.csv")

# Convert timestamps
gen_df['DATE_TIME'] = pd.to_datetime(gen_df['DATE_TIME'], format='%d-%m-%Y %H:%M')
sensor_df['DATE_TIME'] = pd.to_datetime(sensor_df['DATE_TIME'], format='%Y-%m-%d %H:%M:%S')

# Merge datasets
merged_df = pd.merge(gen_df, sensor_df, on=['DATE_TIME', 'PLANT_ID'])

# Feature Engineering
merged_df['hour'] = merged_df['DATE_TIME'].dt.hour
merged_df['day'] = merged_df['DATE_TIME'].dt.day
merged_df['weekday'] = merged_df['DATE_TIME'].dt.weekday
merged_df.sort_values(by='DATE_TIME', inplace=True)

# Create lag and rolling mean features
merged_df['AC_POWER_LAG1'] = merged_df['AC_POWER'].shift(1)
merged_df['AC_POWER_ROLL_MEAN3'] = merged_df['AC_POWER'].rolling(window=3).mean()
merged_df.dropna(inplace=True)

# Log AC_POWER statistics
logging.info(f"AC_POWER mean: {merged_df['AC_POWER'].mean():.4f} kW, std: {merged_df['AC_POWER'].std():.4f} kW")

# Define feature columns and target column
feature_cols = ['hour', 'day', 'weekday', 'AMBIENT_TEMPERATURE', 'MODULE_TEMPERATURE', 'IRRADIATION',
                'AC_POWER_LAG1', 'AC_POWER_ROLL_MEAN3']
target_col = 'AC_POWER'

# Apply Standard Scaling for stable training
scaler = StandardScaler()
scaled_features = scaler.fit_transform(merged_df[feature_cols])

target_scaler = StandardScaler()
scaled_target = target_scaler.fit_transform(merged_df[[target_col]])

# Save scalers inside 'assets' directory
joblib.dump(scaler, 'assets/scaler.save')
joblib.dump(target_scaler, 'assets/target_scaler.save')

logging.info("✅ Data preprocessing complete! Scalers saved successfully.")

# Prepare Time Series Data
X_seq, y_seq = [], []
lookback = 48

for i in range(lookback, len(scaled_features)):
    X_seq.append(scaled_features[i-lookback:i])
    y_seq.append(scaled_target[i])

X_seq = np.array(X_seq)
y_seq = np.array(y_seq)

# Split data
train_size = int(0.8 * len(X_seq))
X_train, X_test = X_seq[:train_size], X_seq[train_size:]
y_train, y_test = y_seq[:train_size], y_seq[train_size:]

# Build Optimized LSTM Model
model = Sequential([
    LSTM(128, return_sequences=True, input_shape=(lookback, X_train.shape[2])),
    BatchNormalization(),
    Dropout(0.1),
    LSTM(64),
    Dense(32, activation="relu"),
    Dense(1)  # Predict AC Power Output
])

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
              loss="mae")

# Train the Model
early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5)

history = model.fit(X_train, y_train,
                    epochs=80,
                    batch_size=32,
                    validation_split=0.2,
                    callbacks=[early_stop, reduce_lr])

# Save trained model inside 'assets' directory
model.save('assets/optimized_solar_forecasting_model.h5')
logging.info("✅ Model training complete! Saved to 'assets' directory.")

# Evaluate Model Performance
y_pred_scaled = model.predict(X_test)
y_pred = target_scaler.inverse_transform(y_pred_scaled)
y_test_actual = target_scaler.inverse_transform(y_test)

mae = mean_absolute_error(y_test_actual, y_pred)
rmse = np.sqrt(mean_squared_error(y_test_actual, y_pred))
r2 = r2_score(y_test_actual, y_pred)

logging.info(f"📊 Model Performance Metrics:")
logging.info(f"MAE: {mae:.4f} kW")
logging.info(f"RMSE: {rmse:.4f} kW")
logging.info(f"R² Score: {r2:.4f}")

# Visualize Predictions
plt.figure(figsize=(12, 6))
plt.plot(y_test_actual[:500], label='Actual AC Power')
plt.plot(y_pred[:500], label='Predicted AC Power', linestyle="dashed")
plt.xlabel("Time Step")
plt.ylabel("AC Power (kW)")
plt.title("Actual vs. Predicted Solar Power Output")
plt.legend()
plt.savefig('assets/actual_vs_predicted.png')
plt.close()
logging.info("Actual vs Predicted plot saved to assets/actual_vs_predicted.png")