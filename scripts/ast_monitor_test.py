import os
import sys

from PyQt6 import QtWidgets

try:
    from ast_monitor.model import AST
except ModuleNotFoundError:
    sys.path.append('../')
    from ast_monitor.model import AST

# Paths to the files with heart rates and GPS data.
hr_data = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hr.txt')
gps_data = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gps.txt')
route_data = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'route.json')

# Debug print statements
print(f"hr_data path: {hr_data}")
print(f"gps_data path: {gps_data}")
print(f"route_data path: {route_data}")

# Check if files exist
if not os.path.exists(hr_data):
    print(f"Heart rate data file does not exist: {hr_data}")
if not os.path.exists(gps_data):
    print(f"GPS data file does not exist: {gps_data}")
if not os.path.exists(route_data):
    print(f"Route data file does not exist: {route_data}")

if __name__ == '__main__':
    app = QtWidgets.QApplication(sys.argv)
    window = AST(hr_data, gps_data, route_data)
    window.show()
    sys.exit(app.exec())
