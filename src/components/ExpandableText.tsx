import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  buttonClassName?: string;
}

export function ExpandableText({ 
  text, 
  maxLength = 150, 
  className, 
  buttonClassName 
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <div className={cn("whitespace-pre-wrap", className)}>{text}</div>;
  }

  const displayText = isExpanded ? text : `${text.slice(0, maxLength).trim()}...`;

  return (
    <div className={cn("whitespace-pre-wrap", className)}>
      {displayText}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={cn(
          "inline-block ml-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors focus:outline-none",
          buttonClassName
        )}
      >
        {isExpanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
}
