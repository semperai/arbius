import { Model, Task } from '@/types';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SearchIcon, ChevronRightIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { truncateString } from '@/lib/utils';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery) return;
    
    // Simple validation for task/address format
    if (searchQuery.startsWith('0x') && searchQuery.length >= 42) {
      // Determine if it's likely a task ID, model, or address based on length
      if (searchQuery.length === 66) {
        window.location.href = `/task/${searchQuery}`;
      } else if (searchQuery.length === 42) {
        window.location.href = `/address/${searchQuery}`;
      } else {
        // Generic search
        window.location.href = `/search?q=${searchQuery}`;
      }
    } else {
      // Generic search
      window.location.href = `/search?q=${searchQuery}`;
    }
  };

  return (
    <>
      <Head>
        <title>Arbius Explorer | Decentralized AI System</title>
        <meta name="description" content="Explore tasks, models, and validators in the Arbius decentralized AI system." />
      </Head>

      {/* Hero Section */}
      <section className="border-b">
        <div className="container px-4 py-16 md:py-24 lg:py-32 mx-auto space-y-10 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Arbius Explorer
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              Explore the decentralized AI system with real-time insights into tasks, models, and validators.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by task ID, model hash, or validator address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Tasks" value="1,234" description="Active AI tasks" />
            <MetricCard title="Active Models" value="89" description="Available AI models" />
            <MetricCard title="Validators" value="156" description="Network validators" />
            <MetricCard title="Solutions" value="10.5k" description="Completed tasks" />
          </div>
        </div>
      </section>

      {/* Recent Tasks Section */}
      <section className="py-12">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recent Tasks</h2>
            <Link href="/task" passHref>
              <Button variant="ghost" className="gap-1">
                View All <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRecentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Models Section */}
      <section className="py-12 border-t">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Models</h2>
            <Link href="/models" passHref>
              <Button variant="ghost" className="gap-1">
                View All <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPopularModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// Helper Components
function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">
          <Link href={`/task/${task.id}`} className="hover:text-primary transition-colors">
            {truncateString(task.id, 16)}
          </Link>
        </CardTitle>
        <CardDescription>Created {task.time} ago</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium truncate max-w-[180px]">{truncateString(task.model, 16)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee:</span>
            <span className="font-medium">{task.fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <TaskStatusBadge status={task.status!} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/task/${task.id}`} passHref className="w-full">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function ModelCard({ model }: { model: Model }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">
          <Link href={`/models/${model.id}`} className="hover:text-primary transition-colors">
            {model.name}
          </Link>
        </CardTitle>
        <CardDescription>{truncateString(model.id, 16)}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Fee:</span>
            <span className="font-medium">{model.fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usage:</span>
            <span className="font-medium">{model.usage} tasks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success Rate:</span>
            <span className="font-medium">{model.successRate}%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/models/${model.id}`} passHref className="w-full">
          <Button variant="outline" className="w-full">View Model</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case 'Completed':
        return 'outline';
      case 'Pending':
        return 'secondary';
      case 'Contested':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {status}
    </Badge>
  );
}

// Helper function to truncate strings
const mockRecentTasks: Task[] = [
  {
    id: '0x1309128093aa6234231eee34234234eff7778aa8a', 
    model: '0x5c23f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.25 AIUS', 
    time: '3h', 
    status: 'Completed',
  },
  {
    id: '0x2409338762aa8734231eee34298734eff7734fa8b', 
    model: '0x8f23f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.15 AIUS', 
    time: '5h', 
    status: 'Pending' 
  },
  {
    id: '0x34093aa762aa8734231eee34298734eff7734fa8c', 
    model: '0x9a25f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.32 AIUS', 
    time: '6h', 
    status: 'Contested' 
  },
  {
    id: '0x44093aa762aa8734231eee34298734eff7734fa8d', 
    model: '0xac25f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.08 AIUS', 
    time: '12h', 
    status: 'Completed' 
  },
  {
    id: '0x54093aa762aa8734231eee34298734eff7734fa8e', 
    model: '0xbc25f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.45 AIUS', 
    time: '1d', 
    status: 'Pending' 
  },
  {
    id: '0x64093aa762aa8734231eee34298734eff7734fa8f', 
    model: '0xdc25f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    fee: '0.18 AIUS', 
    time: '1d', 
    status: 'Completed' 
  }
].map((task) => ({
  ...task,
  owner: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  blocktime: 1634567890,
  version: 1,
  cid: 'QmXyZaBcD1234'
}) as Task);

const mockPopularModels: Model[] = [
  { 
    id: '0x5c23f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    name: 'InferenceAI-V1', 
    fee: '0.15 AIUS', 
    usage: '2,345', 
    successRate: 98,
    addr: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    rate: 0.25,
  },
  { 
    id: '0x8c23f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    name: 'StableDiffusion-XL', 
    fee: '0.25 AIUS', 
    usage: '1,872', 
    successRate: 96,
    addr: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    rate: 0.6,
  },
  { 
    id: '0x9c23f5ca27a3e9a75340e2282e0a853d4fe591d7', 
    name: 'GPT-Arbius', 
    fee: '0.18 AIUS', 
    usage: '1,653', 
    successRate: 94,
    addr: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    rate: 0.15,
  }
];
