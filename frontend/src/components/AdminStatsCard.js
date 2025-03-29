import React from 'react';
import PropTypes from 'prop-types';

const AdminStatsCard = ({ title, value, iconText, color }) => {
  return (
    <div className={`admin-stat-card card border-0 h-100 bg-${color}-subtle`}>
      <div className="card-body p-4">
        <div className={`admin-stat-icon bg-${color}-subtle text-${color}`}>
          {iconText}
        </div>
        <h3 className={`admin-stat-value text-${color}`}>{value}</h3>
        <p className="admin-stat-title">{title}</p>
      </div>
    </div>
  );
};

AdminStatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  iconText: PropTypes.string.isRequired,
  color: PropTypes.string
};

AdminStatsCard.defaultProps = {
  color: 'primary'
};

export default AdminStatsCard;