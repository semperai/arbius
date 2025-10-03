import { Metadata } from 'next';
import { HomePage } from './page.client';

export const metadata: Metadata = {
  title: 'Arbius Explorer | Decentralized AI System',
  description: 'Explore tasks, models, and validators in the Arbius decentralized AI system.',
};

export default function Home() {
  return <HomePage />;
}
