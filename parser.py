import os
import argparse
from pathlib import Path


def create_ascii_separator():
    """Generate a simple ASCII art separator"""
    return (
            "\n"
            + "=" * 50
            + "\n"
            + "*" * 15
            + " FILE SEPARATOR "
            + "*" * 15
            + "\n"
            + "=" * 50
            + "\n"
    )


def should_ignore_file(file_path):
    """
    Determine if a file should be ignored based on its extension or name
    for Spring Boot and Angular projects.
    """
    # List of extensions to ignore
    ignored_extensions = {
        # Common binary and non-code files
        ".pth", ".pyc", ".class", ".jar", ".war", ".ear", ".zip", ".tar", ".gz", ".rar",
        ".exe", ".dll", ".so", ".dylib", ".obj", ".o", ".a", ".lib", ".png", ".jpg",
        ".jpeg", ".gif", ".bmp", ".ico", ".svg", ".pdf", ".doc", ".docx", ".ppt", ".pptx",
        ".xls", ".xlsx", ".db", ".sqlite", ".sqlite3",

        # Documentation
        ".md", ".markdown", ".txt", ".rst",

        # Package management
        ".lock", ".resolved",

        # Angular/Node specific
        ".map", ".min.js", ".min.css", ".d.ts",

        # IDE and configuration
        ".iml", ".project", ".classpath", ".settings", ".idea", ".vscode",
        ".DS_Store", "Thumbs.db",

        ".ini", ".log"
    }

    # Specific files to ignore
    ignored_files = {
        ".gitignore", ".gitattributes", ".editorconfig", ".prettierrc",
        "package-lock.json", "yarn.lock", "tsconfig.json",
        "karma.conf.js", "tslint.json", "browserslist", "polyfills.ts",
        "manifest.yml", "Dockerfile", ".dockerignore", ".npmrc", ".npmignore",
        ".env", ".env.example", "mvnw", "mvnw.cmd", "gradlew", "gradlew.bat"
    }

    # Directories to ignore
    ignored_dirs = {
        "node_modules", ".git", ".github", ".gradle", "target", "build", "dist",
        "out", "bin", "obj", "coverage", "e2e", "test-output", "__pycache__", ".next", "lib",".venv", "dataset"
    }

    # Check for ignored directories in path
    path_parts = Path(file_path).parts
    for part in path_parts:
        if part in ignored_dirs:
            return True

    # Check extension and filename
    file_name = os.path.basename(file_path)
    file_ext = os.path.splitext(file_path)[1].lower()

    return (file_ext in ignored_extensions) or (file_name in ignored_files)


def process_directory(directory_path, output_file):
    """
    Process all relevant files in the given directory and its subdirectories,
    writing their contents to the output file with separators.
    """
    try:
        # Convert to absolute path for clarity
        abs_dir_path = os.path.abspath(directory_path)
        print(f"Processing directory: {abs_dir_path}")

        # Create the output file
        with open(output_file, "w", encoding="utf-8", errors="replace") as out_f:
            out_f.write(f"Content from directory: {abs_dir_path}\n\n")

            file_count = 0
            skipped_count = 0

            # Walk through the directory
            for root, _, files in os.walk(abs_dir_path):
                for file in files:
                    file_path = os.path.join(root, file)

                    # Skip the output file if it's in the same directory
                    if os.path.abspath(file_path) == os.path.abspath(output_file):
                        continue

                    # Skip files that should be ignored
                    if should_ignore_file(file_path):
                        skipped_count += 1
                        continue

                    try:
                        # Try to read the file as text
                        with open(
                                file_path, "r", encoding="utf-8", errors="replace"
                        ) as f:
                            content = f.read()

                        # Write file path and content to output file
                        out_f.write(f"FILE PATH: {file_path}\n\n")
                        out_f.write(content)
                        out_f.write(create_ascii_separator())

                        file_count += 1
                        print(f"Processed: {file_path}")

                    except Exception as e:
                        print(f"Error processing {file_path}: {e}")
                        out_f.write(f"FILE PATH: {file_path}\n\n")
                        out_f.write(f"[ERROR: Could not read file contents: {e}]")
                        out_f.write(create_ascii_separator())

            out_f.write(f"\nTotal files processed: {file_count}")
            out_f.write(f"\nTotal files skipped: {skipped_count}")
            print(f"Completed! {file_count} files processed and {skipped_count} files skipped. Saved to {output_file}")

    except Exception as e:
        print(f"An error occurred: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Collect content from relevant files in a directory into a single text file."
    )
    parser.add_argument(
        "directory",
        help="Path to the directory to process (e.g., 'D:/Work-PCD/falsiified/services/user/src/main/java/com/pcd/authentication')"
    )
    parser.add_argument(
        "-o", "--output", default="directory_contents.txt", help="Output file name (e.g., 'authentication.txt')"
    )
    parser.add_argument(
        "--include-ext",
        nargs="+",
        help="Additional file extensions to include (e.g., --include-ext md txt)"
    )
    parser.add_argument(
        "--exclude-ext",
        nargs="+",
        help="Additional file extensions to exclude (e.g., --exclude-ext css scss)"
    )

    args = parser.parse_args()

    process_directory(args.directory, args.output)


if __name__ == "__main__":
    main()