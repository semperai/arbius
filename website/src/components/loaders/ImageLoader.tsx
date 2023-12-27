import Image from 'next/image'

interface Props {
  src: string;
  alt: string;
}

export default function ImageLoader({ src, alt }: Props) {
  return (
    <Image
      src={src}
      loader={({src, width, quality}) => src}
      crossOrigin='anonymous'
      unoptimized
      width={512}
      height={512}
      alt={alt}
    />
  )
}
