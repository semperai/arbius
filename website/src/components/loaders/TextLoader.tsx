import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'

interface Props {
  src: string;
}

export default function TextLoader({ src }: Props) {
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
    <ReactMarkdown>{text}</ReactMarkdown>
  );
}
