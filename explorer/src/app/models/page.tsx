import { Metadata } from 'next';
import { ModelsPage } from './page.client';

export const metadata: Metadata = {
  title: 'Models | Arbius Explorer',
  description: 'Browse AI models available on the Arbius decentralized AI system.',
};

export default function Models() {
  return <ModelsPage />;
}
