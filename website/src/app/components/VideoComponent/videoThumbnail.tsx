'use client';
import React, { useState } from 'react';
import Image, { StaticImageData } from 'next/image';

type VideoThumbnailProps = {
  thumbnailSrc: StaticImageData;
  altText: string;
  url: string;
}

export default function VideoThumbnail({
  thumbnailSrc,
  altText,
  url,
}: VideoThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className='relative h-[95%] w-[96%] cursor-pointer overflow-hidden rounded-[20px]'
      //   onMouseEnter={() => setIsHovered(true)}
      //   onMouseLeave={() => setIsHovered(false)}
    >
      {!isHovered ? (
        <a href={url} target='_blank'>
          <Image
            className='h-[auto] w-[auto]'
            src={thumbnailSrc}
            alt={altText}
            layout='fill'
            objectFit='cover'
          />
        </a>
      ) : null}
    </div>
  );
};
