import { Metadata } from 'next';
import TasksPageClient from './page.client';

export const metadata: Metadata = {
  title: 'Tasks | Arbius Explorer',
  description: 'Browse AI tasks in the Arbius decentralized AI system.',
};

export default function TasksPage() {
  return <TasksPageClient />;
}
