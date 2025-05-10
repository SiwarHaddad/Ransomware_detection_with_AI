# RansomGuard AI 🛡️🤖

AI-Powered Ransomware Detection and Protection. This application provides a comprehensive suite to monitor file system activity, detect potential ransomware threats using AI and heuristics, and offer tools for analysis and response.

## Key Features

*   **Real-time File System Monitoring:** Utilizes `watchdog` to monitor a designated directory for file creation, modification, deletion, and renaming events.
*   **AI-Powered Threat Detection:** Employs a Random Forest Classifier (scikit-learn) trained on a PE header feature dataset to identify malicious executable patterns.
*   **Heuristic-Based Detection:**
    *   Detects creation of files with common ransom note keywords (e.g., \"DECRYPT\", \"RANSOM\").
    *   Identifies rapid file modification activities.
*   **Process Blocking (Experimental):** Attempts to terminate suspicious processes associated with detected threats using `psutil`. *Currently uses a heuristic for simulation purposes.*
*   **Automatic File Backups:** Periodically backs up the monitored directory to a separate location. Backups are also triggered on critical threat detection.
*   **Ransomware Attack Simulation:** Includes an educational script to simulate ransomware-like behaviors (file renaming, note creation) safely without actual encryption.
*   **Web-based Dashboard:** A Next.js frontend provides:\n    *   System status overview (Protected, At Risk, Under Attack, Scanning, Detector Offline).
    *   Real-time metrics like active threats, files monitored, and AI engine status.\n    *   Controls to start/stop the backend detector and trigger simulations/scans.
    *   Display of file activity charts, recent alerts, AI predictions (parsed from detector logs), and identified malicious files.
    *   Log viewer for detector and simulation logs.
*   **Alert System:** Generates alerts for suspicious activities, categorized by severity.
*   **Configuration Options:** Frontend settings page for (mock) configuration of detection parameters.

## Technology Stack

### Backend:
  *  Python 3.x
  *  Flask (for API)
  *   `psutil` (for process information and management)
  *   `watchdog` (for file system monitoring)
  *   `scikit-learn` (for the AI model - RandomForestClassifier)
  *   `pandas`, `numpy` (for data handling)
### Frontend:
  *   Next.js 15
  *   React 19
  *   TypeScript
  *   Shadcn UI (component library)
  *   Tailwind CSS (styling)
  *   Recharts (for charts)
  *   Lucide React (icons)

### Dataset:
  *   A CSV file (`ransomware_dataset.csv`) containing PE header features for training the AI model.

## Project Structure
  
  ```
  Ransomware_detection_with_AI/
  ├── back/                         # Backend components
│   ├── app.py                    # Flask API server
│   ├── ransomware_detector.py    # Core detection engine
│   ├── simulate_ransomware.py    # Ransomware simulation script
│   ├── monitored_documents/      # Directory monitored by the detector (create this)
│   ├── dataset/                  # Contains the training dataset
│   │   └── ransomware_dataset.csv # AI model training data (ensure this exists)
│   ├── _detector_backups/        # Default location for backups (created automatically)
│   ├── ransomware_detection.log  # Log file for the detector
│   └── educational_simulation.log # Log file for the simulator

├── front/                        # Frontend Next.js application
│   ├── app/                      # Next.js app directory
│   │   ├── page.tsx              # Main dashboard UI
│   │   ├── alerts/page.tsx       # Alerts page
│   │   ├── settings/page.tsx     # Settings page
│   │   └── api/                  # (Mostly mock) Frontend API routes
│   ├── components/               # React components (UI, custom)
│   ├── context/                  # React context (app-context.tsx)
│   ├── public/                   # Static assets
│   ├── ... (Next.js config files)
│
└── parser.py                     # Utility script to aggregate code for analysis
```

## Setup and Installation

### Prerequisites
*   Python 3.8+ and pip
*   Node.js (LTS version recommended) and pnpm (or npm/yarn)
### Backend Setup

1.  **Navigate to the backend directory:**
  ```bash
  cd Ransomware_detection_with_AI/back
  ```
2.  **Create and activate a virtual environment:**
  ```bash
  python -m venv venv
  # Windows
  venv\\Scripts\\activate
  # macOS/Linux
  source venv/bin/activate
  ```
3.  **Install Python dependencies:**
  Create a `requirements.txt` file in the `back` directory with the following content:
    ```txt
    Flask
    Flask-CORS
    psutil
    watchdog
    numpy
    pandas
    scikit-learn
    ```
    Then run:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Prepare Dataset and Directories:**
    *   Ensure the `dataset/ransomware_dataset.csv` file is present in the `back/dataset/` directory. This file is crucial for AI model training.
    *   Create the `monitored_documents` directory inside `back/` if it doesn't exist:
        ```bash
        mkdir monitored_documents
        ```
    You can place some sample files here for the detector to monitor.

### Frontend Setup

1.  **Navigate to the frontend directory:**
```bash
cd Ransomware_detection_with_AI/front
```
2.  **Install Node.js dependencies:**

(Using pnpm as per `pnpm-lock.yaml`, but npm or yarn can also be used
```bash
pnpm install
# or
# npm install
# or
# yarn install
```

## Running the Application
1.  **Start the Backend Server:**
    *   Open a terminal, navigate to the `Ransomware_detection_with_AI/back` directory, and activate the virtual environment.
    *   Run the Flask API:
    ```bash
    python app.py
    ```
    *   The backend server will typically start on `http://localhost:5001`.
    
2.  **Start the Frontend Development Server:**
    *   Open another terminal, navigate to the `Ransomware_detection_with_AI/front` directory.
    *   Run the Next.js development server:
    ```bash
    pnpm dev
    # or
    # npm run dev
    # or
    # yarn dev
    ```
    *   The frontend application will be accessible at `http://localhost:3000`.
    
## How It Works
  1.  **Backend Detector (`ransomware_detector.py`):**
    *   Continuously monitors the `back/monitored_documents/` directory for file system changes.
    *   **Heuristics:** Checks for ransom note file creations and rapid file modifications.
    *   **AI Detection:**
    *   The AI model (Random Forest) is trained on `ransomware_dataset.csv` using PE header features.
    *   During runtime, `extract_features` prepares input for the model based on observed file characteristics (currently file size, modification frequency, executability). *Note: This runtime feature extraction is simpler than the full PE header set used for training, which might impact live AI detection accuracy for PE files if not augmented.*
    *   Predicts if a file/activity is malicious.
    *   Triggers alerts for suspicious activities, logs them to `ransomware_detection.log`.
    *   Attempts to block identified malicious processes.
    *   Performs automatic backups to `back/_detector_backups/`.
2.  **Backend API (`app.py`):**
    *   Provides endpoints for the frontend to:
    *   Start, stop, and get the status of the `ransomware_detector.py` process.
    *   Trigger the `simulate_ransomware.py` script.
    *   Initiate a (simulated) scan of the monitored directory.
    *   Fetch detector and simulation logs.
3.  **Frontend Dashboard (`front/app/page.tsx` & `front/context/app-context.tsx`):**
    *   Communicates with the Flask API to manage the detector and retrieve data.
    *   **Log Parsing:** The `app-context.tsx` fetches detector logs and parses them to generate:
    *   Frontend alerts (displayed on the dashboard and alerts page).
    *   AI prediction entries.
    *   A list of recently detected malicious files.
    *   File system event listings.
    *   Provides a user interface to visualize system status, alerts, and interact with the backend functionalities.
4.  **Simulation (`simulate_ransomware.py`):**
    *   This script, when triggered, creates benign and \"malicious-looking\" (text-based, not actual malware) files in a `ransomware_education` subdirectory.
    *   It simulates file renaming (e.g., adding `.demo`) and creates an educational ransom note. This is purely for demonstration and testing the detector's response to file system changes.

## Key Files
    *   `back/app.py`: The main backend Flask API orchestrating operations.
    *   `back/ransomware_detector.py`: The heart of the detection system, including file monitoring, AI, heuristics, and response actions.
    *   `back/simulate_ransomware.py`: Script for safe, educational ransomware behavior simulation.
    *   `back/dataset/ransomware_dataset.csv`: **Crucial** dataset for training the AI detection model.
    *   `front/app/page.tsx`: The main dashboard page providing the user interface.
    *   `front/context/app-context.tsx`: Manages frontend state, API interactions, and log parsing for UI display.
    
## Important Notes & Limitations
    *   **Educational Simulation:** The `simulate_ransomware.py` script is for educational and testing purposes only. It **does not** perform any actual encryption or malicious actions.
    *   **Process Blocking Heuristic:** The current process blocking logic in `ransomware_detector.py` (specifically the \"SIMULATION HEURISTIC\") identifies other Python processes as suspicious. This is a placeholder and would need significant refinement for reliable use in a real-world scenario.
    *   **Frontend API Routes:** The Next.js API routes under `front/app/api/` (e.g., `/detect`, `/monitor`, `/block`) are largely mock implementations. The primary backend interaction is with the Flask API.
    *   **AI Feature Discrepancy:** The AI model in `ransomware_detector.py` is trained on PE header features from the CSV. However, the runtime `extract_features` function in the same script currently extracts simpler features (file size, mod_freq, is_executable). For the AI to effectively use its training on PE files during live monitoring, the `extract_features` function would need to be enhanced to parse PE headers from live files or a different mechanism for feature provision would be needed.
    *   **Dataset Dependency:** The AI detection functionality is heavily dependent on the `ransomware_dataset.csv`. Without it, or if its format/content is incorrect, the AI model training will fail.
    *   **Target Directory:** The backend monitors `back/monitored_documents/`. 
## Potential Future Enhancements

*   Integration of more sophisticated AI/ML models or deep learning techniques.
*   Network traffic analysis for C2 communication detection.
*   Implementation of decoy/honeypot file systems.
*   Advanced process analysis (behavioral, memory analysis).
*   Full implementation and integration of the frontend Next.js API routes.
*   User management and role-based access control.
*   Cloud integration for centralized management and threat intelligence.
*   Real-time PE header extraction and analysis for AI detection.
