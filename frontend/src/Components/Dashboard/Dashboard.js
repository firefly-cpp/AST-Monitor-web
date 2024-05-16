import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'leaflet/dist/leaflet.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Dashboard = ({ role }) => {
  const myEventsList = []; // Your calendar events for trainers
  const position = [51.505, -0.09]; // Example position for map center for cyclists

  return (
    <div className="dashboard">
      <h1>{role === 'trainer' ? 'Trainer Dashboard' : 'Cyclist Dashboard'}</h1>

      {role === 'trainer' && (
        <div className="calendar-container">
          <h2>Training Calendar</h2>
          <Calendar
            localizer={localizer}
            events={myEventsList}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
          />
        </div>
      )}

      {role === 'cyclist' && (
        <div className="map-container">
          <h2>My Cycling Routes</h2>
          <MapContainer center={position} zoom={13} style={{ height: 500 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                This is your starting point. <br /> Navigate your routes from here!
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
