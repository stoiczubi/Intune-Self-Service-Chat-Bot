import React from 'react';
import { ActionType } from '../types';

interface ActionCardProps {
  title: string;
  icon: React.ReactNode;
  actionType: ActionType;
  onClick: (type: ActionType) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, icon, actionType, onClick }) => {
  return (
    <button
      onClick={() => onClick(actionType)}
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-mdlz-purple transition-all duration-200 group w-32 h-32"
    >
      <div className="text-mdlz-purple group-hover:scale-110 transition-transform duration-200 mb-3">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-600 text-center group-hover:text-mdlz-purple">
        {title}
      </span>
    </button>
  );
};