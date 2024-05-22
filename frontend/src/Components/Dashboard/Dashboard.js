import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'leaflet/dist/leaflet.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../Styles/Dashboard.css';

const localizer = momentLocalizer(moment);

const Dashboard = ({ role, token }) => {
  const [tcxData, setTcxData] = useState({});
  const position = [51.505, -0.09]; // Example position for map center

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/data_fetching/tcx-data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTcxData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="dashboard">
      <h1>{role === 'coach' ? 'Coach Dashboard' : 'Cyclist Dashboard'}</h1>

      {role === 'coach' && (
        <>
          <div className="calendar-container">
            <h2>Training Calendar</h2>
            <Calendar
              localizer={localizer}
              events={[]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
            />
          </div>
          <div className="performance-analytics">
            <h2>Performance Analytics</h2>
            <p>Total distance: {tcxData.total_distance || 'Loading...'} km</p>
            <p>Total ascent: {tcxData.total_ascent || 'Loading...'} meters</p>
            <p>Total descent: {tcxData.total_descent || 'Loading...'} meters</p>
            <p>Average speed: {tcxData.average_speed || 'Loading...'} km/h</p>
            <p>Average heart rate: {tcxData.average_heart_rate || 'Loading...'} bpm</p>
          </div>
          <div className="health-monitoring">
            <h2>Health Monitoring</h2>
          </div>
        </>
      )}

      {role === 'cyclist' && (
        <>
          <div className="map-container">
            <h2>My Cycling Routes</h2>
            <MapContainer center={position} zoom={13} style={{ height: 500 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={position}>
                <Popup>This is your starting point. <br /> Navigate your routes from here!</Popup>
              </Marker>
            </MapContainer>
          </div>
          <div className="training-progress">
            <h2>Training Progress</h2>
            <p>Visualize your progress over time with charts of your training sessions.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
