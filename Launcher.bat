@echo off
start "" cmd /k "cd backend && pip install -r requirements.txt && python main.py"
start "" cmd /k "cd frontend && npm install && npm start"