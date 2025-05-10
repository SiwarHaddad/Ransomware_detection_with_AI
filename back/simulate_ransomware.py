import os
import time
import random
import logging
import shutil
from datetime import datetime

# Setup logging
logging.basicConfig(filename="educational_simulation.log", level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")

def create_demo_file(file_path, malicious=False):
    """
    Create a demo file that simulates characteristics of executables.
    This version uses simple text rather than binary PE headers.
    
    Args:
        file_path: Path to create the file
        malicious: Whether to create a file with "malicious" characteristics (for demo only)
    """
    try:
        with open(file_path, "w") as f:
            f.write("EDUCATIONAL DEMO FILE - NOT ACTUAL MALWARE\n")
            f.write("=" * 50 + "\n\n")
            
            if malicious:
                f.write("[This file represents what malware might look like]\n")
                f.write("Characteristics that might be present in malicious files:\n")
                f.write("- Small or missing debug information\n")
                f.write("- Unusual version numbers\n")
                f.write("- Large export tables\n")
                f.write("- Multiple sections\n")
                f.write("- Suspicious characteristics flags\n\n")
            else:
                f.write("[This file represents a benign executable]\n")
                f.write("Characteristics common in legitimate software:\n")
                f.write("- Proper debug information\n")
                f.write("- Standard version numbers\n")
                f.write("- Normal export tables\n")
                f.write("- Typical section count\n")
                f.write("- Standard characteristics\n\n")
                
            f.write("Created: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n")
            f.write("Educational purposes only.\n")
            
        logging.info(f"Created {'simulation malicious' if malicious else 'benign'} demo file: {file_path}")
        return True
    except Exception as e:
        logging.error(f"Error creating demo file {file_path}: {e}")
        return False

def simulate_file_transformation(file_path):    
    """
    Simulate file transformation by adding an extension and modified content.
    This doesn't use random data to avoid triggering security software.
    """
    try:
        # Read the original content
        with open(file_path, "r") as f:
            content = f.read()
            
        new_path = file_path + ".demo"
        with open(new_path, "w") as f:
            f.write("EDUCATIONAL SIMULATION - TRANSFORMED FILE\n")
            f.write("=" * 50 + "\n\n")
            f.write("Original content would be inaccessible in real ransomware.\n")
            f.write("Original filename: " + os.path.basename(file_path) + "\n")
            f.write("Transformed: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
            f.write("ORIGINAL CONTENT PRESERVED FOR EDUCATIONAL PURPOSES:\n")
            f.write("-" * 50 + "\n")
            f.write(content)
            
        logging.info(f"Simulated transformation on: {file_path} -> {new_path}")
        return new_path
    except Exception as e:
        logging.error(f"Error simulating transformation on {file_path}: {e}")
        return None

def create_educational_note(directory):
    """Create an educational note file explaining ransomware concepts."""
    note_path = os.path.join(directory, "EDUCATIONAL_RANSOMWARE_INFO.txt")
    
    try:
        with open(note_path, "w") as f:
            f.write("""EDUCATIONAL INFORMATION ABOUT RANSOMWARE
======================================

This is an educational simulation that demonstrates how ransomware operates.
NO ACTUAL ENCRYPTION OR HARMFUL ACTIONS WERE PERFORMED.

In a real ransomware attack:
-----------------------------
1. Files would be encrypted using strong cryptography, not just renamed
2. The original files would be completely inaccessible without a decryption key
3. A ransom note would demand payment, typically in cryptocurrency
4. The attack might spread across a network or delete backups

Protection strategies:
---------------------
1. Keep regular backups on separate, offline media
2. Keep software and operating systems updated
3. Use reputable security software
4. Be cautious with email attachments and downloads
5. Implement proper access controls and network segmentation
6. Have an incident response plan ready

This simulation was created for educational purposes only.
Created: {0}
""".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        logging.info(f"Educational note created: {note_path}")
        return note_path
    except Exception as e:
        logging.error(f"Error creating educational note: {e}")
        return None

def create_benign_files(directory, num_files=3):
    """Create sample benign files for the demonstration."""
    logging.info(f"Creating {num_files} sample benign files...")
    print(f"Creating {num_files} sample benign files...")
    
    files_created = []
    
    for i in range(num_files):
        # Create text documents
        text_file = os.path.join(directory, f"sample_document_{i}.txt")
        try:
            with open(text_file, "w") as f:
                f.write(f"This is a sample document {i}.\n")
                f.write("It contains example text that represents user data.\n")
                f.write("In a real ransomware attack, files like this would be encrypted.\n")
                f.write("Created on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            logging.info(f"Created sample text file: {text_file}")
            files_created.append(text_file)
        except Exception as e:
            logging.error(f"Error creating sample text file: {e}")
    
    # Create a sample configuration file
    config_file = os.path.join(directory, "sample_config.ini")
    try:
        with open(config_file, "w") as f:
            f.write("[Settings]\n")
            f.write("theme=default\n")
            f.write("autoSave=true\n")
            f.write("interval=300\n")
            f.write("\n[User]\n")
            f.write("name=SampleUser\n")
            f.write("lastLogin=" + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        logging.info(f"Created sample config file: {config_file}")
        files_created.append(config_file)
    except Exception as e:
        logging.error(f"Error creating config file: {e}")
    
    return files_created

def run_educational_simulation(directory, num_examples=2, num_targets=3):
    """
    Run an educational simulation that demonstrates ransomware concepts
    without performing any actions that might trigger security software.
    
    Args:
        directory: Directory to create files in
        num_examples: Number of example files to create
        num_targets: Number of sample files to transform
    """
    logging.info("Starting educational ransomware simulation...")
    print("Starting educational ransomware simulation...")
    
    sample_files = create_benign_files(directory, num_targets)
    time.sleep(1)  
    
    print("Creating educational example files...")
    for i in range(num_examples):
        benign_example = os.path.join(directory, f"benign_example_{i}.txt")
        create_demo_file(benign_example, malicious=False)
        
        malicious_example = os.path.join(directory, f"malicious_example_{i}.txt")
        create_demo_file(malicious_example, malicious=True)
        
        time.sleep(0.5) 

    print("Simulating file transformation (educational only)...")
    transformed_files = []
    for file_path in sample_files:
        time.sleep(0.5)  
        transformed = simulate_file_transformation(file_path)
        if transformed:
            transformed_files.append(transformed)

    create_educational_note(directory)

    logging.info("Educational simulation completed.")
    print("\nEducational simulation completed.")
    print(f"Created {len(sample_files)} sample files and {len(transformed_files)} transformed examples.")
    print(f"Check the '{directory}' directory to see the results.")
    print("Note: No real encryption or harmful actions were performed.")

if __name__ == "__main__":
    base_dir = os.path.abspath("./")
    simulation_dir = os.path.join(base_dir, "ransomware_education")

    if not os.path.exists(simulation_dir):
        print(f"Creating directory: {simulation_dir}")
        os.makedirs(simulation_dir)
    else:
        print(f"Cleaning up existing files in {simulation_dir}...")
        for item in os.listdir(simulation_dir):
            item_path = os.path.join(simulation_dir, item)
            try:
                if os.path.isfile(item_path):
                    os.unlink(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
            except Exception as e:
                print(f"Error cleaning up {item_path}: {e}")
    
    run_educational_simulation(simulation_dir)