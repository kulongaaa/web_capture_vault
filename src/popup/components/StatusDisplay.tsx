import React from 'react';
import { LearningStatus } from '../../types';

interface StatusDisplayProps {
  status: LearningStatus;
  message: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, message }) => {
  if (status === LearningStatus.IDLE) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case LearningStatus.LEARNING:
        return <div className="status-spinner"></div>;
      case LearningStatus.COMPLETED:
        return <span className="status-icon success">✓</span>;
      case LearningStatus.ERROR:
        return <span className="status-icon error">✗</span>;
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case LearningStatus.LEARNING:
        return 'learning';
      case LearningStatus.COMPLETED:
        return 'completed';
      case LearningStatus.ERROR:
        return 'error';
      default:
        return '';
    }
  };

  return (
    <div className={`status-display ${getStatusClass()}`}>
      {getStatusIcon()}
      <span className="status-message">{message}</span>
    </div>
  );
}; 