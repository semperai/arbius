import ImageLoader from '@/components/loaders/ImageLoader';
import TextLoader from '@/components/loaders/TextLoader';
import VideoLoader from '@/components/loaders/VideoLoader';

import { Template } from '@/types/Template';

interface Props {
  template: Template;
  cid: string;
}

export default function RenderSolution({ template, cid }: Props) {
  const items = [];

  for (let row of template.output) {
    const src = process.env
      .NEXT_PUBLIC_IPFS_GATEWAY_FSTR!.replace('%C', cid)
      .replace('%F', row.filename);

    items.push(
      <div
        key={`${cid}.${row.filename}.${row.type}`}
        className='flex justify-center'
      >
        {row.type === 'image' && (
          <ImageLoader src={src} alt='Generated Image' />
        )}
        {row.type === 'text' && <TextLoader src={src} />}
        {row.type === 'video' && <VideoLoader src={src} />}
      </div>
    );
  }

  return <>{items}</>;
}
