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
    className={`absolute left-1/2 transform -translate-x-1/2 bg-white shadow-stats p-3 rounded-lg  transition-opacity duration-300 ${isHovered ? 'opacity-100 block' : 'opacity-0 hidden'}`}
    ref={editRef}
    style={{ width: boxStyle?.width, bottom: '500%',marginBottom: customStyle.marginBottom?customStyle.marginBottom:'60px', zIndex: boxStyle?.zIndex }}
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
     <span className="absolute bottom-[-6px] transform -translate-x-1/2" style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid white', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', left:customStyle.arrowLeft?customStyle.arrowLeft:"50%"}}></span>
  </div>
</span>


  );
};

export default HintBox;
