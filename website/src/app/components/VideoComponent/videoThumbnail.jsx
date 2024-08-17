"use client"
import React, { useState } from 'react';
import Image from 'next/image';

const VideoThumbnail = ({ thumbnailSrc, altText ,url}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-[96%] h-[95%] overflow-hidden cursor-pointer rounded-[20px]"
    //   onMouseEnter={() => setIsHovered(true)}
    //   onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered ? (
        <a href={url} target='_blank'>
            <Image
        className='h-[auto] w-[auto]'
          src={thumbnailSrc}
          alt={altText}
          layout="fill"
          objectFit="cover"
        />
        </a>
      ) : null}
    </div>
  );
};

export default VideoThumbnail;
