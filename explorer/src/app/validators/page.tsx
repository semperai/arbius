import { Metadata } from 'next';
import ValidatorsPageClient from './page.client';

export const metadata: Metadata = {
  title: 'Validators | Arbius Explorer',
  description: 'Browse validators in the Arbius decentralized AI system.',
};

export default function ValidatorsPage() {
  return <ValidatorsPageClient />;
}
