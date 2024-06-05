// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import AthleteOverview from './AthleteOverview'; // Import the AthleteOverview component
// import AthleteProfile from './AthleteProfile'; // Import the AthleteProfile component
// import Sidebar from '../Sidebar'; // Make sure the path is correct
//
// const CoachDashboard = ({ token }) => {
//   return (
//     <div className="coach-dashboard">
//       <Sidebar role="coach" /> {/* Pass 'coach' as a prop if your Sidebar requires it */}
//         <p>blablabla</p>
//       <div className="content">
//         <Routes>
//           <Route path="/overview" element={<AthleteOverview token={token} />} />
//           <Route path="/athlete/:id" element={<AthleteProfile token={token} />} />
//           <Route path="*" element={<Navigate to="/overview" />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };
//
// export default CoachDashboard;
