"use client"
import React, { useState, useEffect, useRef } from 'react';

const HintBox = ({ content, customStyle, link, boxStyle, hoverId, currentHoverId, setCurrentHoverId }) => {
  const isHovered = currentHoverId === hoverId;
  let editRef = useRef(null);

  useEffect(() => {
    const hoverElement = document.getElementById(hoverId);

    if (!hoverElement) {
      console.warn(`Element with ID ${hoverId} not found.`);
      return;
    }

    const handleMouseEnter = () => setCurrentHoverId(hoverId);
    const handleMouseLeave = (e) => {
      if (!editRef.current.contains(e.relatedTarget)) {
        setCurrentHoverId(null);
      }
    };

    hoverElement.addEventListener('mouseenter', handleMouseEnter);
    hoverElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hoverElement.removeEventListener('mouseenter', handleMouseEnter);
      hoverElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverId, setCurrentHoverId]);

  return (
    <span className="relative inline-block" style={customStyle}>
      <div
        className={`absolute top-1/2 left-full transform -translate-y-1/2 bg-white border shadow-lg p-3 rounded-md transition-opacity duration-300 ${isHovered ? 'opacity-100 block' : 'opacity-0 hidden'}`}
        ref={editRef}
        style={{ width: boxStyle?.width, top: boxStyle?.top, zIndex: boxStyle?.zIndex }}
        onMouseEnter={() => setCurrentHoverId(hoverId)}
        onMouseLeave={() => setCurrentHoverId(null)}
      >
        <p className="m-0 mb-1 text-gray-700 text-sm">{content}</p>
        {link?.length ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm relative inline-block">
            Click for more!
            <span className="absolute left-0 bottom-0 w-full h-px bg-blue-500 scale-x-0 origin-bottom-right transition-transform duration-250 ease-out"></span>
          </a>
        ) : null}
      </div>
    </span>
  );
};

export default HintBox;
