# ⚡ CIRCAD — AI-Based Dynamic Contact Resistance Measurement (DCRM) Analysis for EHV Circuit Breakers

CIRCAD (Circuit Intelligence for Resistance and Contact Analysis and Diagnostics) is an AI-powered web platform designed to automate the **Dynamic Contact Resistance Measurement (DCRM)** process for **Extra High Voltage (EHV) circuit breakers**.  
It transforms raw resistance data into intelligent insights through machine learning, offering fault prediction, health evaluation, and interactive visualization — all within a seamless and modern user interface.

---

## 🧠 Overview

CIRCAD aims to digitize and automate the manual process of DCRM analysis. Traditionally, engineers interpret thousands of resistance-time waveform data points manually, which is time-consuming and error-prone.  
CIRCAD replaces this with an intelligent, AI-driven analysis workflow that is fast, accurate, and explainable.

---

## 💡 Problem Statement

**Title:** AI-Based Dynamic Contact Resistance Measurement (DCRM) Analysis for EHV Circuit Breakers  
**Problem ID:** 25189

DCRM testing is essential for assessing the health of circuit breakers, but manual waveform interpretation is slow and subjective.  
Engineers often face challenges like:
- Large, unstructured datasets.
- Lack of automated diagnostic tools.
- No predictive insights for preventive maintenance.
- Tedious manual report generation.

---

## 🚀 Solution

CIRCAD offers an **AI-based diagnostic system** that automatically:
- Processes uploaded DCRM CSV files.
- Cleans and normalizes the waveform data.
- Performs **statistical analysis** and **pattern recognition**.
- Predicts breaker condition (Healthy / Warning / Faulty).
- Generates a professional, downloadable **PDF report**.

The diagram below illustrates the end-to-end workflow.
![Tech 1](https://github.com/user-attachments/assets/6d6eb86e-6ff0-4603-8ed7-c493de6918c4)

Through its intuitive web dashboard, CIRCAD delivers interactive charts, summary statistics, and smart analytics for engineers and maintenance teams.

---

## 🌟 Features

- 🧠 **AI-Driven Analysis** — Automatically classifies breaker health conditions.
- 📤 **Smart Upload System** — Upload DCRM test files with live progress feedback.
- 📊 **Interactive Visualization** — Resistance-time curves and waveform comparisons.
- 📈 **Dashboard Insights** — Health trends and performance statistics.
- 📄 **Report Generator** — AI-generated, downloadable PDF analysis reports.
- 🌗 **Dark/Light Mode** — Responsive theme with smooth transitions.
- ☁️ **Cloud Ready** — Scalable deployment using Docker & Kubernetes.

---

## ⚙️ Technical Architecture

**Frontend:** React.js + Tailwind CSS + Framer Motion  
**Backend:** Django REST Framework (Python)  
**AI Layer:** Python (NumPy, Pandas, Scikit-learn)  
**Database:** PostgreSQL / SQLite / MongoDB  
**Cloud Integration:** Google Cloud Storage (GCS) for file handling  
**Authentication:** JWT-based secure access  
**Deployment:** Docker + Kubernetes for scalability and fault tolerance  

---

## 🔁 Workflow Summary

1. **Upload CSV File:** User uploads DCRM data from the testing equipment.  
2. **Preprocessing:** Data is validated and normalized.  
3. **AI Analysis:** The ML engine evaluates waveform data and predicts health.  
4. **Visualization:** The results are displayed with graphs and insights.  
5. **Reporting:** A professional PDF report is generated for download.  
6. **Storage:** All results are stored securely for dashboard review and future comparison.

---

## 🧰 Tech Stack

| Category | Technologies |
|-----------|--------------|
| Frontend | React.js, Tailwind CSS, Framer Motion |
| Backend | Django REST Framework |
| AI/ML | Python, Pandas, NumPy, Scikit-learn |
| Database | PostgreSQL / MongoDB |
| Authentication | JWT |
| Cloud | Google Cloud Storage (GCS) |
| Deployment | Docker, Kubernetes |

---

## 🧩 Core Modules

### 1️⃣ Upload Panel
- Upload DCRM CSV files.
- Backend validation and secure file handling.
- Live progress tracking.

### 2️⃣ Analysis Panel
- Real-time AI-based analysis.
- Displays statistical metrics:
  - Mean Resistance (µΩ)
  - Standard Deviation (µΩ)
  - Range (Min–Max)
  - Predicted Condition & Confidence Score
- Interactive resistance-time line charts.

### 3️⃣ Dashboard Panel
- Overview of system-wide breaker conditions.
- Historical performance visualization.
- Trends and alerts.

### 4️⃣ Reports Panel
- Displays all uploaded test results.
- Downloadable AI-generated reports.
- Tabular and graphical summaries.

---

## 🧮 AI Analysis Details

The ML model performs:
- **Signal Cleaning:** Removes noise from waveform data.
- **Feature Extraction:** Captures key resistance pattern metrics.
- **Classification:** Predicts breaker status (Healthy, Warning, Faulty).
- **Forecasting:** Predicts next mean resistance using trend analysis.

The model continuously improves through retraining with new DCRM data samples.

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/CIRCAD.git
cd CIRCAD
```
### 2️⃣ Backend Setup (Django)
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
### 3️⃣ Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```
### 4️⃣ Environment Variables
#### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```
#### Backend (.env)
```ini
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
GCS_BUCKET_NAME=your_bucket_name
```

---

## 🖥️ Usage Guide

1. Log in using your registered account.
2. Navigate to the Upload panel and submit a .csv DCRM file.
3. Wait for analysis completion.
4. View results in the Analysis panel.
5. Monitor all results on the Dashboard.
6. Generate reports from the Reports section.

---

## 📊 Example Output Metrics

| Parameter |	Description |	Example Value |
|-----------|--------------------------------------------|-----------|
| Mean Resistance	| Average resistance across waveform | 52.5 µΩ |
| Std. Deviation |	Variation in resistance |	1.2 µΩ |
| Range |	Min–Max range of resistance |	50–55 µΩ |
| Condition |	AI-detected breaker state |	Healthy |
| Confidence |	ML model confidence |	96% |
| Forecast (Next Cycle) |	Predicted mean resistance |	53.1 µΩ |

---

## 🧭 Potential Impact

- ⏱️ Reduces DCRM analysis time from hours to seconds.
- 🔍 Increases accuracy and reliability in breaker diagnostics.
- 💾 Creates a centralized database for maintenance history.
- ⚙️ Enables predictive maintenance to avoid system failures.
- 🌍 Promotes AI adoption in electrical maintenance and power grid reliability.

---

## 🔮 Future Scope

- Real-time data ingestion from circuit breaker sensors.
- Integration with SCADA and monitoring systems.
- Enhanced predictive analytics with time-series models.
- Multi-user collaboration and access control.
- Mobile app integration for field technicians.
