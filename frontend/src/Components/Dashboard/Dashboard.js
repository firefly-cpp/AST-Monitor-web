import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'leaflet/dist/leaflet.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const Dashboard = () => {
  const myEventsList = []; // Your calendar events
  const position = [51.505, -0.09]; // Example position for map center

  return (
    <div className="dashboard">
      <div className="calendar-container">
        <Calendar
          localizer={localizer}
          events={myEventsList}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
        />
      </div>
      <div className="map-container">
        <MapContainer center={position} zoom={13} style={{ height: 500 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;
