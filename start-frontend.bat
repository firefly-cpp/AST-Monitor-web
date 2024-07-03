@echo off

:: Navigate to the frontend directory and start the server
cd frontend
start cmd /k "npm start"

:: Navigate to the AST-Monitor directory and start the server
cd ..\AST-Monitor-main\AST-Monitor-main\ast_monitor\map
start cmd /k "npm run dev"
