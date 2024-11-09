'use client';
import React, { useState, useEffect, useRef } from 'react';

const HintBox = ({
  content,
  customStyle,
  link,
  boxStyle,
  hoverId,
  currentHoverId,
  setCurrentHoverId,
}) => {
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
    <span className='relative inline-block' style={customStyle}>
      <div
        className={`absolute left-1/2 -translate-x-1/2 transform rounded-lg bg-white-background p-3 text-black-text shadow-stats transition-opacity duration-300 ${isHovered ? 'block opacity-100' : 'hidden opacity-0'}`}
        ref={editRef}
        style={{
          width: boxStyle?.width,
          bottom: '500%',
          marginBottom: customStyle.marginBottom
            ? customStyle.marginBottom
            : '60px',
          zIndex: boxStyle?.zIndex,
        }}
        onMouseEnter={() => setCurrentHoverId(hoverId)}
        onMouseLeave={() => setCurrentHoverId(null)}
      >
        <p className='m-0 mb-1 text-sm text-[#A5A5A5]'>{content}</p>
        {link?.length ? (
          <a
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 relative inline-block text-sm'
          >
            Click for more!
            <span className='duration-250 bg-blue-500 absolute bottom-0 left-0 h-px w-full origin-bottom-right scale-x-0 transition-transform ease-out'></span>
          </a>
        ) : null}
        <span
          className='absolute bottom-[-6px] -translate-x-1/2 transform'
          style={{
            width: '0',
            height: '0',
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            left: customStyle.arrowLeft ? customStyle.arrowLeft : '50%',
          }}
        ></span>
      </div>
    </span>
  );
};

export default HintBox;
