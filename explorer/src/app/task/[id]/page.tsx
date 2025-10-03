import { Metadata } from 'next';
import TaskDetailClient from './page.client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Task ${id} | Arbius Explorer`,
    description: `View details for task ${id} on Arbius`,
  };
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetailClient id={id} />;
}
