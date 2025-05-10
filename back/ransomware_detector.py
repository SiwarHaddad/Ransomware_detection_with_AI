import time
import psutil
import threading
import shutil
import logging
import os
import numpy as np
import pandas as pd
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

try:
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from datetime import datetime
from collections import defaultdict, deque

# --- Configuration ---
LOG_FILE = "ransomware_detection.log"
BACKUP_INTERVAL_SECONDS = 300 # Backup every 5 minutes 
RANSOM_NOTE_KEYWORDS = ["DECRYPT", "RANSOM", "RECOVER", "README", "HELP", "INSTRUCTION", "_RECOVERY_", "RESTORE"]
EXECUTABLE_EXTENSIONS = {'.exe', '.dll', '.bat', '.scr', '.com', '.vbs', '.ps1'} 
MODIFICATION_WINDOW_SECONDS = 10
MODIFICATION_TRACK_COUNT = 15 
AI_CONFIDENCE_THRESHOLD = 0.80 # Threshold for triggering high confidence AI alert

# Setup logging - Log to file and console
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# File Handler
file_handler = logging.FileHandler(LOG_FILE, mode='a')
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

# Console Handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.INFO) 

# Get root logger and add handlers
logger = logging.getLogger()
logger.setLevel(logging.INFO)

if logger.hasHandlers():
    logger.handlers.clear()
logger.addHandler(file_handler)
logger.addHandler(console_handler)


# AI feature extraction 
def extract_features(file_path, mod_times, process_info=None, detector_instance=None):
    num_expected_features = 0
    feature_names_used = []
    if detector_instance and hasattr(detector_instance, 'feature_names') and detector_instance.feature_names:
        num_expected_features = len(detector_instance.feature_names)
        feature_names_used = detector_instance.feature_names
    else:
        num_expected_features = 6 
        logging.warning(f"extract_features called without valid detector_instance or feature_names for {file_path}. Using default feature count: {num_expected_features}.")

    placeholder_features = [0.0] * num_expected_features

    try:
        if 'file_size' in feature_names_used:
            idx = feature_names_used.index('file_size')
            if os.path.exists(file_path): placeholder_features[idx] = os.path.getsize(file_path)
        if 'mod_freq' in feature_names_used:
             idx = feature_names_used.index('mod_freq')
             if len(mod_times) > 1:
                 time_diff = mod_times[-1] - mod_times[0]
                 if time_diff > 0: placeholder_features[idx] = len(mod_times) / time_diff
        if 'is_executable' in feature_names_used:
             idx = feature_names_used.index('is_executable')
             placeholder_features[idx] = 1.0 if file_path.lower().endswith(('.exe', '.dll', '.bat', '.scr', '.com')) else 0.0
    except Exception as e:
         logging.error(f"Partial feature extraction failed for {file_path}: {e}")
    # -----------------------------------------------------------------

    return placeholder_features

# Process management
def block_process(pid):
    """Terminate a process by PID with enhanced logging."""
    try:
        process = psutil.Process(pid)
        proc_name = process.name()
        logging.info(f"Attempting termination of PID={pid} Name={proc_name}")
        process.terminate()
        try:
            process.wait(timeout=1)
            logging.info(f"[PROCESS_BLOCKED] PID={pid} Name={proc_name} Action=Terminated")
            print(f"[BLOCK] Process {pid} ({proc_name}) terminated.")
            return True
        except psutil.TimeoutExpired:
            logging.warning(f"Process PID={pid} Name={proc_name} did not terminate gracefully, attempting kill.")
            process.kill()
            process.wait(timeout=1)
            logging.info(f"[PROCESS_KILLED] PID={pid} Name={proc_name} Action=Killed")
            print(f"[BLOCK] Process {pid} ({proc_name}) force-killed.")
            return True
    except psutil.NoSuchProcess:
        logging.warning(f"Process {pid} not found for blocking (already terminated?).")
        print(f"[INFO] Process {pid} not found for blocking.")
        return False
    except psutil.AccessDenied:
        logging.error(f"Access denied blocking process {pid}. Run with elevated privileges?")
        print(f"[ERROR] Access denied blocking process {pid}. Try running as administrator.")
        return False
    except Exception as e:
        logging.error(f"Error blocking process {pid}: {e}")
        print(f"[ERROR] Error blocking process {pid}: {e}")
        return False

# Ransomware detector class
class RansomwareDetector(FileSystemEventHandler):
    def __init__(self, monitored_dir, dataset_csv_path=None):
        self.monitored_dir = os.path.normpath(monitored_dir)
        self.base_backup_dir = os.path.join(os.path.dirname(monitored_dir), "_detector_backups")
        self.backup_dir = os.path.join(self.base_backup_dir, "backup_" + datetime.now().strftime("%Y%m%d_%H%M%S"))
        os.makedirs(self.base_backup_dir, exist_ok=True)

        self.last_backup_time = 0
        self.model = None
        self.feature_names = []
        self.alert_triggered_files = set()
        self.recently_blocked_pids = set()
        self.file_modification_times = defaultdict(lambda: deque(maxlen=MODIFICATION_TRACK_COUNT))
        self.lock = threading.Lock()

        if SKLEARN_AVAILABLE and dataset_csv_path and os.path.exists(dataset_csv_path):
            self.model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', n_jobs=-1) # Use more cores if available
            self.train_model(dataset_csv_path)
        elif not SKLEARN_AVAILABLE:
            logging.warning("AI detection disabled because scikit-learn is not installed.")
            print("[WARNING] AI detection disabled because scikit-learn is not installed.")
        else:
            logging.error("Dataset CSV path not provided or file not found. AI detection disabled.")
            print("[ERROR] Dataset CSV path not provided or file not found. AI detection disabled.")


    def train_model(self, dataset_csv_path):
        try:
            print(f"Loading dataset from {dataset_csv_path}...")
            df = pd.read_csv(dataset_csv_path)
            logging.info(f"Dataset loaded with columns: {list(df.columns)}")

            label_column_name = "Benign"
            if label_column_name not in df.columns:
                error_msg = f"Missing label column '{label_column_name}' in CSV."
                logging.error(error_msg)
                print(f"[ERROR] {error_msg}")
                self.model = None
                return

            self.feature_names = [
                "DebugSize",
                "MajorImageVersion",
                "MajorOSVersion",
                "ExportSize",
                "IatVRA",
                "NumberOfSections",
                "SizeOfStackReserve",
                "DllCharacteristics",
                "ResourceSize"
            ]
            logging.info(f"Selected features for training: {self.feature_names}")

            missing_features = [col for col in self.feature_names if col not in df.columns]
            if missing_features:
                error_msg = f"Missing feature columns in CSV: {', '.join(missing_features)}"
                logging.error(error_msg)
                print(f"[ERROR] {error_msg}")
                self.model = None
                return

            df_features = df[self.feature_names].copy()
            df_features = df_features.fillna(0)
            
            X = df_features.values
            y_benign = df[label_column_name].values
            y = 1 - y_benign 

            if len(X) == 0:
                logging.error("No valid data rows for training after processing.")
                print("[ERROR] No valid data rows for training.")
                self.model = None
                return

            unique, counts = np.unique(y, return_counts=True)
            class_dist_str = str(dict(zip(unique, counts)))
            print(f"Class distribution for training (1=Malicious, 0=Benign): {class_dist_str}")
            logging.info(f"Class distribution for training: {class_dist_str}")
            if len(unique) < 2:
                 logging.warning("Training data only contains one class. Model may not be effective.")
                 print("[WARNING] Training data only contains one class.")

            print(f"Training AI model with {len(X)} samples using features: {', '.join(self.feature_names)}...")
            self.model.fit(X, y)
            logging.info(f"AI model trained with {len(X)} samples.")
            print("AI model trained successfully.")

        except FileNotFoundError:
             logging.error(f"Dataset file not found at {dataset_csv_path}")
             print(f"[ERROR] Dataset file not found: {dataset_csv_path}")
             self.model = None
        except KeyError as e:
             logging.error(f"Column missing during feature/label selection: {e}")
             print(f"[ERROR] Column missing in CSV: {e}")
             self.model = None
        except Exception as e:
            logging.error(f"Error training AI model: {e}", exc_info=True)
            print(f"[ERROR] Error training AI model: {e}")
            self.model = None

            
    def _is_monitored_path(self, path):
         norm_path = os.path.normpath(path)
         if not norm_path.startswith(self.monitored_dir): return False
         if norm_path.startswith(self.base_backup_dir): return False
         log_file_abs = os.path.abspath(LOG_FILE)
         if norm_path == log_file_abs: return False
         return True

    def on_created(self, event):
        if event.is_directory: return
        file_path = os.path.normpath(event.src_path)
        if not self._is_monitored_path(file_path): return
        logging.info(f"File created: {file_path}") 
        self.analyze_event(file_path, 'create')

    def on_modified(self, event):
        if event.is_directory: return
        file_path = os.path.normpath(event.src_path)
        if not self._is_monitored_path(file_path): return
        if file_path in self.alert_triggered_files:
             logging.debug(f"Ignoring modification for recently alerted file: {file_path}")
             return
        logging.info(f"File modified: {file_path}")
        self.analyze_event(file_path, 'modify')

    def on_deleted(self, event):
         if event.is_directory: return
         file_path = os.path.normpath(event.src_path)
         if not self._is_monitored_path(file_path): return
         logging.info(f"File deleted: {file_path}")

    def on_moved(self, event):
        if event.is_directory: return
        src_path = os.path.normpath(event.src_path)
        dest_path = os.path.normpath(event.dest_path)
        monitored_src = self._is_monitored_path(src_path)
        monitored_dest = self._is_monitored_path(dest_path)
        if not monitored_src and not monitored_dest: return
        logging.info(f"File moved: {src_path} -> {dest_path}")
        if monitored_dest:
            self.analyze_event(dest_path, 'rename', old_path=src_path)

    def analyze_event(self, file_path, event_type, old_path=None):
        current_time = time.time()
        pid = os.getpid() 

        try:
            is_ransom_note = False
            if event_type == 'create':
                filename_upper = os.path.basename(file_path).upper()
                if any(keyword in filename_upper for keyword in RANSOM_NOTE_KEYWORDS):
                     is_ransom_note = True
                     reason = f"Ransom note created: File={file_path} DetectorPID={pid}"
                     logging.critical(f"[CRITICAL ALERT] Reason: {reason}")
                     self.trigger_alert(reason, critical=True, attempt_block=True, file_involved=file_path)

            rapid_mod_detected = False
            if event_type == 'modify':
                with self.lock:
                     self.file_modification_times[file_path].append(current_time)
                     mod_times = list(self.file_modification_times[file_path])
                if len(mod_times) >= 5:
                    time_diff = mod_times[-1] - mod_times[0]
                    if len(mod_times) >= MODIFICATION_TRACK_COUNT and time_diff <= MODIFICATION_WINDOW_SECONDS :
                        rapid_mod_detected = True
                        reason = f"Rapid modification detected: File={file_path} Count={len(mod_times)} Window={time_diff:.2f}s DetectorPID={pid}"
                        logging.warning(reason) 
                        self.trigger_alert(reason, critical=False, attempt_block=True, file_involved=file_path)

            ai_detected_malicious = False
            if self.model:
                try:
                    features = extract_features(file_path, self.file_modification_times[file_path], detector_instance=self)
                    features_array = np.array(features).reshape(1, -1)
                    if features_array.shape[1] != len(self.feature_names):
                         logging.error(f"Feature mismatch for AI prediction. Expected {len(self.feature_names)}, got {features_array.shape[1]}. File: {file_path}")
                    else:
                        prediction = self.model.predict(features_array)[0]
                        probability = self.model.predict_proba(features_array)[0][1]
                        log_msg = f"[AI_DETECT Probability={probability:.4f} File={file_path} Prediction={'Malicious' if prediction == 1 else 'Benign'} DetectorPID={pid}]"
                        logging.info(log_msg)

                        if prediction == 1 and probability >= AI_CONFIDENCE_THRESHOLD:
                            ai_detected_malicious = True
                            reason = f"AI detected high confidence malicious activity (Prob={probability:.4f}): File={file_path} DetectorPID={pid}"
                            logging.critical(f"[CRITICAL ALERT] Reason: {reason}")
                            self.trigger_alert(reason, critical=True, attempt_block=True, file_involved=file_path)
                        elif prediction == 1: 
                             reason_warn = f"AI detected low confidence malicious activity (Prob={probability:.4f}): File={file_path} DetectorPID={pid}"
                             logging.warning(reason_warn)
                           
                except Exception as e:
                     logging.error(f"Error during AI prediction for {file_path}: {e}", exc_info=True)

            if is_ransom_note or rapid_mod_detected or ai_detected_malicious:
                 with self.lock:
                    if file_path not in self.alert_triggered_files:
                         self.alert_triggered_files.add(file_path)
                         threading.Timer(60.0, self.remove_from_alerted, args=[file_path]).start()

        except Exception as e:
            logging.error(f"Error analyzing event for {file_path}: {e}", exc_info=True)

        if current_time - self.last_backup_time > BACKUP_INTERVAL_SECONDS:
             backup_thread = threading.Thread(target=self.backup_files, daemon=True)
             backup_thread.start()

    def remove_from_alerted(self, file_path):
        with self.lock:
            self.alert_triggered_files.discard(file_path)
        logging.debug(f"Removed {file_path} from alerted set.")

    def trigger_alert(self, reason, critical=False, attempt_block=False, file_involved=None):
        level = logging.CRITICAL if critical else logging.WARNING
        log_prefix = "[CRITICAL ALERT]" if critical else "[Warning]"

        logging.log(level, f"{log_prefix} Reason: {reason}")

        print(f"\n{'='*10} {log_prefix} RANSOMWARE ACTIVITY DETECTED {'='*10}")
        print(f"Reason: {reason}")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        if file_involved: print(f"File Involved: {file_involved}")
        print(f"Check logs: {LOG_FILE}")
        print(f"{'='*(42 + len(log_prefix))}\n")

        block_performed = False
        if attempt_block:
             suspicious_pid_to_block = None
             try:
                 current_pid = os.getpid()
                 parent_pid = psutil.Process(current_pid).ppid()
                 for proc in psutil.process_iter(['pid', 'name']):
                     if 'python' in proc.info['name'].lower() and proc.info['pid'] != current_pid:
                        suspicious_pid_to_block = proc.info['pid']
                        logging.warning(f"SIMULATION HEURISTIC: Identified PID {suspicious_pid_to_block} ({proc.info['name']}) for blocking.")
                        break
             except Exception as e: logging.error(f"Error finding process to block: {e}")

             if suspicious_pid_to_block and suspicious_pid_to_block not in self.recently_blocked_pids:
                 print(f"[ACTION] Attempting to block suspicious process PID: {suspicious_pid_to_block}...")
                 if block_process(suspicious_pid_to_block):
                     block_performed = True
                     self.recently_blocked_pids.add(suspicious_pid_to_block)
                     threading.Timer(300.0, self.recently_blocked_pids.discard, args=[suspicious_pid_to_block]).start()
                 else: print(f"[ACTION] Failed to block PID {suspicious_pid_to_block}.")
             else: print("[ACTION] No suspicious process identified or recently blocked.")

        if critical or block_performed:
            print("[ACTION] Triggering immediate backup...")
            backup_thread = threading.Thread(target=self.backup_files, daemon=True)
            backup_thread.start()

    def backup_files(self):
        if not self.lock.acquire(blocking=False):
             logging.warning("Backup already in progress, skipping.")
             print("[INFO] Backup skipped, already running.")
             return
        try:
            start_time = time.time()
            backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            current_backup_dir = os.path.join(self.base_backup_dir, f"backup_{backup_timestamp}")

            logging.info(f"[BACKUP_START] Target={current_backup_dir}")
            print(f"Starting backup to {current_backup_dir}...")

            os.makedirs(current_backup_dir, exist_ok=True)
            copied_files, skipped_files, copied_dirs = 0, 0, 0
            log_file_abs = os.path.abspath(LOG_FILE)

            for root, dirs, files in os.walk(self.monitored_dir, topdown=True):
                 if os.path.normpath(root).startswith(self.base_backup_dir):
                     dirs[:] = []
                     continue

                 relative_path = os.path.relpath(root, self.monitored_dir)
                 dest_root = os.path.join(current_backup_dir, relative_path) if relative_path != '.' else current_backup_dir

                 try:
                     if not os.path.exists(dest_root): os.makedirs(dest_root); copied_dirs +=1
                 except Exception as e:
                      logging.error(f"Error creating backup directory {dest_root}: {e}"); continue

                 for file in files:
                     src_file_path = os.path.join(root, file)
                     dest_file_path = os.path.join(dest_root, file)
                     if os.path.normpath(src_file_path) == log_file_abs:
                          skipped_files += 1; continue
                     try:
                          shutil.copy2(src_file_path, dest_file_path); copied_files += 1
                     except Exception as e:
                          logging.error(f"Error copying file {src_file_path} to {dest_file_path}: {e}"); skipped_files += 1

            duration = time.time() - start_time
            logging.info(f"[BACKUP_END] Duration={duration:.2f}s CopiedFiles={copied_files} CopiedDirs={copied_dirs} Skipped={skipped_files} Target={current_backup_dir}")
            print(f"Backup completed ({duration:.2f}s). {copied_files} files copied.")
            self.last_backup_time = time.time() 
        except Exception as e:
            logging.error(f"General backup error: {e}", exc_info=True)
            print(f"[ERROR] General backup error: {e}")
        finally:
             self.lock.release()

# --- Main Execution ---
def start_monitoring(directory_to_watch, dataset_csv_path):
    if not os.path.isdir(directory_to_watch):
        print(f"[ERROR] Directory does not exist: {directory_to_watch}")
        logging.error(f"Monitor directory not found: {directory_to_watch}")
        return

    print("Initializing Ransomware Detector...")
    logging.info("Initializing Ransomware Detector...")
    try:
        event_handler = RansomwareDetector(directory_to_watch, dataset_csv_path)
        
        if time.time() - event_handler.last_backup_time > BACKUP_INTERVAL_SECONDS or event_handler.last_backup_time == 0:
             print("Performing initial backup...")
             initial_backup_thread = threading.Thread(target=event_handler.backup_files, daemon=True)
             initial_backup_thread.start()

        observer = Observer()
        observer.schedule(event_handler, directory_to_watch, recursive=True)
        observer.start()
        pid = os.getpid()
        print(f"Monitoring started on: {directory_to_watch} (PID: {pid})")
        logging.info(f"Monitoring started on {directory_to_watch} (PID: {pid})")

        try:
            while True: time.sleep(60); logging.debug("Monitoring thread alive.")
        except KeyboardInterrupt:
            print("\nStopping monitoring (KeyboardInterrupt)...")
            logging.info("Monitoring stopping due to KeyboardInterrupt.")
        finally:
             observer.stop()
             observer.join()
             print("Monitoring stopped.")
             logging.info("Monitoring stopped.")

    except (ValueError, ImportError) as e: 
         print(f"[FATAL ERROR] Could not initialize detector: {e}")
         logging.critical(f"Could not initialize detector: {e}")
    except Exception as e:
         print(f"[FATAL ERROR] Unexpected error starting monitoring: {e}")
         logging.critical(f"Unexpected error starting monitoring: {e}", exc_info=True)

if __name__ == "__main__":
    print("Ransomware Detector Script Starting...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    monitored_dir_abs = os.path.join(script_dir, "monitored_documents")
    dataset_csv_path_abs = os.path.join(script_dir, "dataset", "ransomware_dataset.csv")

    print(f"Script Directory: {script_dir}")
    print(f"Monitoring Directory: {monitored_dir_abs}")
    print(f"Dataset Path: {dataset_csv_path_abs}")

    if not os.path.exists(monitored_dir_abs):
        print(f"Creating monitoring directory: {monitored_dir_abs}")
        try: os.makedirs(monitored_dir_abs)
        except OSError as e:
             print(f"[FATAL ERROR] Could not create monitoring directory: {e}"); logging.critical(f"Could not create monitoring directory: {e}"); exit(1)

    if not os.path.exists(dataset_csv_path_abs):
        print(f"\n[ERROR] AI dataset '{os.path.basename(dataset_csv_path_abs)}' not found in '{os.path.dirname(dataset_csv_path_abs)}'.")
        if SKLEARN_AVAILABLE:
             print("[FATAL ERROR] Cannot start AI detection without the dataset. Exiting.")
             logging.critical(f"Dataset not found at {dataset_csv_path_abs}. Exiting.")
             exit(1)
        else:
             print("[WARNING] Continuing without AI features (scikit-learn not installed).")
             start_monitoring(monitored_dir_abs, None)
    else:
         start_monitoring(monitored_dir_abs, dataset_csv_path_abs)