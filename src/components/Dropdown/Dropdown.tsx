import React, { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción',
  disabled = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`dropdown ${className} ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`dropdown-toggle ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id={id}
      >
        <span className="dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <ul className="dropdown-menu" role="listbox" id={`${id}-listbox`}>
          {options.map(option => (
            <li
              key={option.value}
              className={`dropdown-item ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
              id={`${id}-option-${option.value}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;