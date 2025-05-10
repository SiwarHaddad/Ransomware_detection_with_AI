# back/app.py
import os
import subprocess
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import threading
import time
import random
import sys

# --- Configuration ---
LOG_FILE_DETECTOR = "ransomware_detection.log"
LOG_FILE_SIMULATION = "ransomware_simulation.log"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MONITORED_DIR = os.path.join(BASE_DIR, "monitored_documents")
DETECTOR_SCRIPT = os.path.join(BASE_DIR, "ransomware_detector.py")
SIMULATOR_SCRIPT = os.path.join(BASE_DIR, "simulate_ransomware.py")
DATASET_CSV_PATH = os.path.join(BASE_DIR, "dataset", "ransomware_dataset.csv")

EXECUTABLE_EXTENSIONS = {'.exe', '.dll', '.bat', '.scr', '.com'}
RANSOMWARE_EXTENSIONS = {'.encrypted', '.locked', '.crypto', '.ransom', '.crypt', '.pay', '.wallet'}

# Setup logging FOR THE API SERVER 
api_log_formatter = logging.Formatter('%(asctime)s - API - %(levelname)s - %(message)s')
api_console_handler = logging.StreamHandler(sys.stdout) # Log API messages to console
api_console_handler.setFormatter(api_log_formatter)
api_logger = logging.getLogger('api_logger') 
api_logger.setLevel(logging.INFO)
api_logger.addHandler(api_console_handler)
api_logger.propagate = False #

app = Flask(__name__)
CORS(app)


detector_process_handle = None 
detector_lock = threading.Lock()

def find_process_by_script(script_path):
    """Finds a running process executing the specified Python script."""
    target_script_norm = os.path.normpath(script_path)
    current_python_executable = os.path.basename(sys.executable).lower()
    python_executables_to_check = {current_python_executable, 'python.exe', 'pythonw.exe', 'python', 'python3'}
    api_logger.debug(f"Searching for process running script: {target_script_norm}")
    api_logger.debug(f"Checking against python executables: {python_executables_to_check}")
    try:
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'exe']):
            try:
                proc_info = proc.info
                proc_exe = proc_info.get('exe')
                proc_cmdline = proc_info.get('cmdline')

                if not proc_exe or not proc_cmdline or len(proc_cmdline) < 2:
                    continue

                proc_exe_name = os.path.basename(proc_exe).lower()

                # Check if the process executable matches known Python interpreters
                if proc_exe_name not in python_executables_to_check:
                    continue

                # Ensure arguments are strings before normalizing
                cmdline_args_norm = [os.path.normpath(str(arg)) for arg in proc_cmdline[1:] if isinstance(arg, str)]

                # Check if the target script path is in the normalized arguments
                if target_script_norm in cmdline_args_norm:
                    api_logger.debug(f"Found matching process PID: {proc_info['pid']} Cmdline: {proc_cmdline}")
                    return proc # Return the psutil.Process object

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                api_logger.debug(f"Skipping process PID {proc.info.get('pid', 'N/A')} due to state or permissions.")
                continue
            except Exception as e:
                api_logger.warning(f"Error inspecting process PID {proc.info.get('pid', 'N/A')}: {e}")
                continue
    except Exception as e:
        
        api_logger.error(f"General error iterating processes in find_process_by_script: {e}")
    api_logger.debug("No matching process found.")
    return None


@app.route('/detector/start', methods=['POST'])
def start_detector():
    global detector_process_handle
    with detector_lock:
        api_logger.info("Received /detector/start request.")
        existing_proc = find_process_by_script(DETECTOR_SCRIPT)
        if existing_proc:
            pid = existing_proc.pid
            api_logger.info(f"Detector already running (PID: {pid}).")
            if detector_process_handle and detector_process_handle.pid != pid:
                 api_logger.warning(f"API handle PID ({detector_process_handle.pid}) mismatched running PID ({pid}). Handle cleared.")
                 detector_process_handle = None 
            return jsonify({"status": "already_running", "pid": pid}), 200

        if not os.path.exists(DATASET_CSV_PATH):
             error_msg = f"Dataset CSV not found at {DATASET_CSV_PATH}. Cannot start detector."
             api_logger.error(error_msg)
             return jsonify({"status": "error", "message": error_msg}), 400

        if not os.path.exists(DETECTOR_SCRIPT):
            error_msg = f"Detector script not found at {DETECTOR_SCRIPT}. Cannot start detector."
            api_logger.error(error_msg)
            return jsonify({"status": "error", "message": error_msg}), 400

        try:
            api_logger.info(f"Starting ransomware detector script: {DETECTOR_SCRIPT}")
            python_exe = sys.executable
            detector_process_handle = subprocess.Popen(
                [python_exe, DETECTOR_SCRIPT],
                cwd=BASE_DIR,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            pid = detector_process_handle.pid
            api_logger.info(f"Detector process started via API with PID: {pid}")
            
            time.sleep(1.5)
            poll_result = detector_process_handle.poll()
            if poll_result is not None: 
                 error_msg = f"Detector process {pid} terminated immediately after start with code {poll_result}. Check detector logs."
                 api_logger.error(error_msg)
                 detector_process_handle = None
                 return jsonify({"status": "error", "message": error_msg}), 500

            return jsonify({"status": "started", "pid": pid}), 200
        except Exception as e:
            api_logger.error(f"Failed to start detector script: {e}", exc_info=True)
            detector_process_handle = None
            return jsonify({"status": "error", "message": f"Failed to start detector: {str(e)}"}), 500


@app.route('/detector/stop', methods=['POST'])
def stop_detector():
    global detector_process_handle 
    with detector_lock:
        api_logger.info("Received /detector/stop request.")
        proc_to_stop = None
        pid_to_report = None

        # 1. Check our global handle first (if API started it)
        if detector_process_handle:
            pid_to_report = detector_process_handle.pid
            api_logger.debug(f"Checking API process handle PID: {pid_to_report}")
            if psutil.pid_exists(pid_to_report):
                try:
                    proc_to_stop = psutil.Process(pid_to_report)
                    cmdline = proc_to_stop.cmdline()
                    if not (len(cmdline) > 1 and os.path.normpath(DETECTOR_SCRIPT) in [os.path.normpath(str(arg)) for arg in cmdline[1:] if isinstance(arg, str)]):
                        api_logger.warning(f"API handle PID {pid_to_report} is running a different command. Searching by script.")
                        proc_to_stop = None 
                    else:
                         api_logger.info(f"Found detector process via API handle (PID: {pid_to_report})")
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    api_logger.warning(f"API handle PID {pid_to_report} is invalid or inaccessible. Searching by script.")
                    proc_to_stop = None
                finally:
                    if not proc_to_stop:
                         detector_process_handle = None
            else:
                api_logger.info(f"API handle PID {pid_to_report} does not exist anymore. Clearing handle.")
                detector_process_handle = None 

        # 2. If handle didn't yield a valid process, search by script path
        if not proc_to_stop:
            api_logger.debug("API handle did not yield a valid process, searching by script path...")
            found_proc = find_process_by_script(DETECTOR_SCRIPT)
            if found_proc:
                proc_to_stop = found_proc
                pid_to_report = found_proc.pid # Update PID to report
                api_logger.info(f"Found running detector process by script path (PID: {pid_to_report})")

        # 3. Attempt to stop the found process (if any)
        if proc_to_stop:
            try:
                api_logger.info(f"Attempting to terminate detector process (PID: {pid_to_report})")
                proc_to_stop.terminate()
                try:
                    proc_to_stop.wait(timeout=3)
                    api_logger.info(f"Detector process {pid_to_report} terminated successfully.")
                except psutil.TimeoutExpired:
                    api_logger.warning(f"Detector process {pid_to_report} did not terminate gracefully, killing.")
                    proc_to_stop.kill()
                    proc_to_stop.wait(timeout=1)
                    api_logger.info(f"Detector process {pid_to_report} killed.")

                if detector_process_handle and detector_process_handle.pid == pid_to_report:
                    detector_process_handle = None
                return jsonify({"status": "stopped"}), 200
            except psutil.NoSuchProcess:
                 api_logger.warning(f"Detector process {pid_to_report} was already stopped.")
                 if detector_process_handle and detector_process_handle.pid == pid_to_report:
                     detector_process_handle = None
                 return jsonify({"status": "already_stopped"}), 200 
            except Exception as e:
                api_logger.error(f"Failed to stop detector process {pid_to_report}: {e}")
               
                return jsonify({"status": "error", "message": str(e)}), 500
        else:
            api_logger.info("No running detector process found to stop.")
            if detector_process_handle:
                 detector_process_handle = None
            return jsonify({"status": "not_running"}), 404 

@app.route('/detector/status', methods=['GET'])
def get_detector_status():
    with detector_lock: 
        api_logger.debug("Received /detector/status request.")
        running_proc = find_process_by_script(DETECTOR_SCRIPT)
        if running_proc:
            pid = running_proc.pid
            api_logger.debug(f"Detector status: running (PID: {pid})")
            return jsonify({"status": "running", "pid": pid}), 200
        else:
            api_logger.debug("Detector status: stopped")
            return jsonify({"status": "stopped", "pid": None}), 200

# --- Simulate Endpoint ---
@app.route('/simulate', methods=['POST'])
def simulate_attack():
    api_logger.info("Received /simulate request.")
    if not os.path.exists(MONITORED_DIR):
         error_msg = f"Monitored directory '{MONITORED_DIR}' not found. Cannot simulate."
         api_logger.error(error_msg)
         return jsonify({"status": "error", "message": error_msg}), 400
    if not os.path.exists(SIMULATOR_SCRIPT):
         error_msg = f"Simulator script '{SIMULATOR_SCRIPT}' not found."
         api_logger.error(error_msg)
         return jsonify({"status": "error", "message": error_msg}), 400

    try:
        api_logger.info("Executing ransomware simulation script...")
        python_exe = sys.executable
        # Run simulation script, capture output
        result = subprocess.run(
            [python_exe, SIMULATOR_SCRIPT],
            capture_output=True, text=True, check=False, cwd=BASE_DIR, 
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        api_logger.info(f"Simulation script finished with code: {result.returncode}")
        api_logger.info(f"Simulation stdout:\n{result.stdout}")
        if result.stderr: api_logger.warning(f"Simulation stderr:\n{result.stderr}")

        return jsonify({"status": "simulation_started", "message": "Ransomware simulation script executed (check logs)."}), 200

    except Exception as e:
        api_logger.error(f"Error executing simulation script: {e}", exc_info=True)
        return jsonify({"status": "error", "message": f"Error during simulation execution: {str(e)}"}), 500

# --- Scan Endpoint ---
@app.route('/scan', methods=['POST'])
def trigger_scan():
    api_logger.info(f"Received /scan request for directory: {MONITORED_DIR}")
    if not os.path.isdir(MONITORED_DIR):
        error_msg = f"Monitored directory '{MONITORED_DIR}' not found."
        api_logger.error(error_msg)
        return jsonify({"status": "error", "message": error_msg}), 400
    try:
        scanned_files_list = []
        potential_issues = []
        file_count = 0
        # Get absolute paths for log files to reliably skip them
        detector_log_abs = os.path.abspath(LOG_FILE_DETECTOR)
        simulator_log_abs = os.path.abspath(LOG_FILE_SIMULATION)
        backup_base_abs = os.path.abspath(os.path.join(os.path.dirname(MONITORED_DIR), "_detector_backups")) # Backup dir base

        api_logger.info(f"Starting scan simulation in {MONITORED_DIR}...")
        for root, dirs, files in os.walk(MONITORED_DIR, topdown=True):
            # Skip backup directories
            dirs[:] = [d for d in dirs if not os.path.abspath(os.path.join(root, d)).startswith(backup_base_abs)]

            for filename in files:
                file_path = os.path.join(root, filename)
                file_path_abs = os.path.abspath(file_path)

                # Skip log files
                if file_path_abs == detector_log_abs or file_path_abs == simulator_log_abs:
                    continue

                scanned_files_list.append(file_path)
                file_count += 1
                file_ext_lower = os.path.splitext(filename)[1].lower()
                if file_ext_lower in EXECUTABLE_EXTENSIONS:
                    potential_issues.append({"file": file_path, "issue": "Executable found"})
                    api_logger.debug(f"[Scan] Executable found: {file_path}")
                if file_ext_lower in RANSOMWARE_EXTENSIONS:
                    potential_issues.append({"file": file_path, "issue": "Suspicious extension found"})
                    api_logger.debug(f"[Scan] Suspicious extension found: {file_path}")

        # Simulate scan time
        time.sleep(random.uniform(0.5, 1.5))
        api_logger.info(f"Simulated scan complete. Found {file_count} files.")
        return jsonify({
            "status": "scan_complete",
            "message": f"Simulated scan of {MONITORED_DIR} finished.",
            "files_scanned_count": file_count,
            "files_list": scanned_files_list,
            "potential_issues": potential_issues
        }), 200
    except Exception as e:
        api_logger.error(f"Error during simulated scan: {e}", exc_info=True)
        return jsonify({"status": "error", "message": f"Error during scan: {str(e)}"}), 500


# --- Log Endpoints ---
def read_last_log_lines(log_file_path, num_lines=100):
    """Reads the last N lines of a file."""
    try:
        if not os.path.exists(log_file_path):
            return f"Log file not found at {log_file_path}."
        with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            return "".join(lines[-num_lines:])
    except Exception as e:
        api_logger.error(f"Error reading log file {log_file_path}: {e}")
        return f"Error reading log file: {str(e)}"

@app.route('/logs/detector', methods=['GET'])
def get_detector_logs():
    api_logger.debug("Received /logs/detector request.")
    log_content = read_last_log_lines(LOG_FILE_DETECTOR)
    if log_content.startswith("Error") or log_content.startswith("Log file not found"):
         return jsonify({"status": "error", "logs": log_content}), 404 if "not found" in log_content else 500
    else:
         return jsonify({"status": "success", "logs": log_content})


@app.route('/logs/simulation', methods=['GET'])
def get_simulation_logs():
    api_logger.debug("Received /logs/simulation request.")
    log_content = read_last_log_lines(LOG_FILE_SIMULATION)
    if log_content.startswith("Error") or log_content.startswith("Log file not found"):
         return jsonify({"status": "error", "logs": log_content}), 404 if "not found" in log_content else 500
    else:
         return jsonify({"status": "success", "logs": log_content})


if __name__ == '__main__':
    print("------------------------------------------")
    print("Starting Flask API Server for RansomGuard")
    print("------------------------------------------")
    print(f" -> API Base Directory: {BASE_DIR}")
    print(f" -> Detector Script: {DETECTOR_SCRIPT}")
    print(f" -> Simulator Script: {SIMULATOR_SCRIPT}")
    print(f" -> Monitored Directory (intended for detector): {MONITORED_DIR}")
    print(f" -> Dataset CSV (expected by detector): {DATASET_CSV_PATH}")
    print(f" -> Detector Log File: {LOG_FILE_DETECTOR}")
    print(f" -> Simulation Log File: {LOG_FILE_SIMULATION}")
    print("------------------------------------------")
    app.run(host='0.0.0.0', port=5001, debug=False) 