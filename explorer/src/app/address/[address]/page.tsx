import { Metadata } from 'next';
import AddressPageClient from './page.client';
import { truncateMiddle } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Address ${truncateMiddle(address, 8)} | Arbius Explorer`,
    description: `Validator details for ${address} in the Arbius decentralized AI system.`,
  };
}

export default async function AddressPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return <AddressPageClient address={address} />;
}
