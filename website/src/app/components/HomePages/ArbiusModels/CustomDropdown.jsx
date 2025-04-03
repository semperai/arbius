import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import DropDownIcon from '@/app/assets/images/dropdown.svg'
import FilterIcon from '@/app/assets/images/filter.svg'

const CustomDropdown = ({ options, defaultValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || options[0]);
  const dropdownRef = useRef(null);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-20 w-full">
      <div>
        <button
          type="button"
          className="group inline-flex justify-between items-center text-center h-[42px] w-[180px] rounded-[15px] shadow-sm px-4 py-1 bg-white-background font-medium text-black-text"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Image className="h-[11px]" src={FilterIcon} alt="" />
          <div>{selectedOption.name}</div>
          <Image className="ml-2 h-2 w-2" src={DropDownIcon} width={4} height={4} alt="logo" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right w-full text-center absolute right-0 mt-1 rounded-[15px] shadow-lg bg-white-background z-40">
          <div className="py-0" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {options.map((option, index) => (
              <div className="flex justify-between px-2 py-3 hover:bg-purple-background group rounded-[15px]" key={index}>
              <a
                key={option.name}
                href="#"
                className={`block text-black-text group-hover:text-original-white`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                role="menuitem"
              >
                {option.name}
              </a>
              <Image src={option.icon} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;