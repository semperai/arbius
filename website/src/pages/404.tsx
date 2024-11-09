import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';

import LostInSpaceImg from '@/../public/lost-in-space.jpg';

export default function PageNotFound() {
  return (
    <Layout title='404' full={true}>
      <div className='bg-white grid min-h-full grid-cols-1 grid-rows-[1fr,auto,1fr] lg:grid-cols-[max(50%,36rem),1fr]'>
        <header className='mx-auto w-full max-w-7xl px-6 pt-6 sm:pt-10 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:px-8'>
          <Link href='/'>
            <span className='sr-only'>Arbius</span>
          </Link>
        </header>
        <main className='mx-auto w-full max-w-7xl px-6 py-24 sm:py-32 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:px-8'>
          <div className='max-w-lg'>
            <p className='text-red-700 text-base font-semibold leading-8'>
              404
            </p>
            <h1 className='text-gray-900 mt-4 text-3xl font-bold tracking-tight sm:text-5xl'>
              Page not found
            </h1>
            <p className='text-gray-600 mt-6 text-base leading-7'>
              Sorry, we couldn’t find the page you’re looking for.
            </p>
            <div className='mt-10'>
              <Link
                href='/'
                className='text-slate-600 text-sm font-semibold leading-7'
              >
                <span aria-hidden='true'>&larr;</span> Back to home
              </Link>
            </div>
          </div>
        </main>
        <div className='hidden lg:relative lg:col-start-2 lg:row-start-1 lg:row-end-4 lg:block'>
          <Image
            src={LostInSpaceImg}
            alt='lost'
            className='absolute inset-0 h-full w-full object-cover'
          />
        </div>
      </div>
    </Layout>
  );
}
