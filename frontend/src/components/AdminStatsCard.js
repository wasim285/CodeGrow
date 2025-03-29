import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AdminStatsCard.css';

const AdminStatsCard = ({ title, value, icon, color, link }) => {
  const cardContent = (
    <div className={`admin-stats-card ${color}`}>
      <div className="stats-icon">
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stats-content">
        <h3 className="stats-value">{value}</h3>
        <p className="stats-title">{title}</p>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="stats-card-link">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};

export default AdminStatsCard;