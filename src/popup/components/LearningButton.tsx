import React from 'react';

interface LearningButtonProps {
  onStart: () => void;
  disabled?: boolean;
}

export const LearningButton: React.FC<LearningButtonProps> = ({ onStart, disabled = false }) => {
  return (
    <button 
      className={`learning-button ${disabled ? 'disabled' : ''}`}
      onClick={onStart}
      disabled={disabled}
    >
      <span className="button-icon">📚</span>
      <span className="button-text">
        {disabled ? '正在学习中...' : '网页学习'}
      </span>
    </button>
  );
};