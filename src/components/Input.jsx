import React, { forwardRef, useId } from 'react';
import './Input.css';

export const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = '', 
  fullWidth = false,
  icon: Icon,
  ...props 
}, ref) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;

  return (
    <div className={`input-group ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <span className="input-icon"><Icon size={18} /></span>}
        <input 
          id={inputId}
          ref={ref}
          className={`input-field ${Icon ? 'with-icon' : ''} ${error ? 'error' : ''}`}
          {...props} 
        />
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'error-text' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
