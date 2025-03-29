import React from 'react';
import '../styles/AdminDashboard.css';

const AdminStatsCard = ({ title, value, icon, color }) => {
  const getColorClass = () => {
    switch (color) {
      case 'blue': return 'admin-stats-blue';
      case 'green': return 'admin-stats-green';
      case 'amber': return 'admin-stats-amber';
      case 'purple': return 'admin-stats-purple';
      case 'red': return 'admin-stats-red';
      default: return 'admin-stats-blue';
    }
  };

  return (
    <div className={`admin-stats-card ${getColorClass()}`}>
      <div className="admin-stats-card-content">
        <h3 className="admin-stats-title">{title}</h3>
        <div className="admin-stats-value">{value}</div>
      </div>
      <div className="admin-stats-icon">
        {icon}
      </div>
    </div>
  );
};

export default AdminStatsCard;