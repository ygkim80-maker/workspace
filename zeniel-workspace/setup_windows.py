"""ZENIEL WORKSPACE - Windows local setup script.

Creates a virtual environment, installs dependencies, and launches the app.
Run with:  python setup_windows.py
"""
import os
import subprocess
import sys
import venv

ROOT = os.path.dirname(os.path.abspath(__file__))
VENV_DIR = os.path.join(ROOT, ".venv")


def venv_python():
    if os.name == "nt":
        return os.path.join(VENV_DIR, "Scripts", "python.exe")
    return os.path.join(VENV_DIR, "bin", "python")


def main():
    if not os.path.exists(VENV_DIR):
        print("[1/3] 가상환경 생성 중...")
        venv.create(VENV_DIR, with_pip=True)
    else:
        print("[1/3] 가상환경이 이미 존재합니다.")

    py = venv_python()

    print("[2/3] 의존성 설치 중...")
    subprocess.check_call([py, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([py, "-m", "pip", "install", "-r", os.path.join(ROOT, "requirements.txt")])

    print("[3/3] 서버 실행 중... http://127.0.0.1:8000")
    subprocess.check_call([py, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=ROOT)


if __name__ == "__main__":
    main()
