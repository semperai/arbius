import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

interface Props {
  src: string;
}

export default function ProposalLoader({ src }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (text) {
      return;
    }

    async function f() {
      const res = await fetch(src);
      const data = await res.text();
      setText(data);
    }

    f();
  });

  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => (
          <a href={props.href!} className='text-cyan-700'>
            {props.children!}
          </a>
        ),
        code: ({ node, ...props }) => (
          <code
            className={`bg-slate-50 rounded-sm ${props.inline == null || !props.inline ? 'my-2 block px-4 py-4' : 'px-2 py-1'}`}
          >
            {props.children!}
          </code>
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className='text-slate-600 border-gray-400 my-1 border-l-4 p-1 pl-6'>
            {props.children!}
          </blockquote>
        ),
        img: ({ node, ...props }) => (
          <div className='relative h-[50vh] w-full'>
            <Link
              href={`/api/imagecache?url=${encodeURIComponent(props.src!)}`}
              target='_blank'
            >
              <Image
                src={`/api/imagecache?url=${encodeURIComponent(props.src!)}`}
                alt={props.alt!}
                title={props.title!}
                layout='fill'
                objectFit='contain'
              />
            </Link>
          </div>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
