import { Metadata } from 'next';
import ModelDetailClient from './page.client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Model ${id} | Arbius Explorer`,
    description: `View details for model ${id} on Arbius`,
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModelDetailClient id={id} />;
}
