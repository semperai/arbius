import { useState, useEffect } from 'react';

interface Props {
  src: string;
}

export default function VideoLoader({ src }: Props) {
  return (
    <video crossOrigin='anonymous' autoPlay loop controls>
      <source src={src} type='video/mp4' />
    </video>
  );
}
