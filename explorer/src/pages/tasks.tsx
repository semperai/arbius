import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { SearchIcon, SlidersIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncateMiddle, formatTimeAgo } from "@/lib/utils";

interface Task {
  id: string;
  model: string;
  modelName?: string;
  fee: bigint;
  owner: string;
  blocktime: number;
  version: number;
  cid: string;
  status: 'Completed' | 'Pending' | 'Contested';
  solution?: {
    validator: string;
    blocktime: number;
    claimed: boolean;
  };
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);

        // Task enumeration requires an external indexer
        // The blockchain doesn't provide a way to list all tasks directly
        // For now, we'll show an empty list with a message
        setTimeout(() => {
          setTasks([]);
          setLoading(false);
        }, 500);

      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    // Apply status filter
    if (statusFilter !== 'all' && task.status.toLowerCase() !== statusFilter) {
      return false;
    }

    // Apply time filter
    const now = Math.floor(Date.now() / 1000);
    if (timeFilter === '24h' && (now - task.blocktime > 24 * 60 * 60)) {
      return false;
    } else if (timeFilter === '7d' && (now - task.blocktime > 7 * 24 * 60 * 60)) {
      return false;
    } else if (timeFilter === '30d' && (now - task.blocktime > 30 * 24 * 60 * 60)) {
      return false;
    }

    // Apply search query
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      task.id.toLowerCase().includes(query) ||
      task.model.toLowerCase().includes(query) ||
      task.owner.toLowerCase().includes(query) ||
      (task.modelName && task.modelName.toLowerCase().includes(query))
    );
  });

  // Sort tasks based on sortBy
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.blocktime - a.blocktime;
      case 'oldest':
        return a.blocktime - b.blocktime;
      case 'fee-high':
        return parseFloat(ethers.formatEther(b.fee)) - parseFloat(ethers.formatEther(a.fee));
      case 'fee-low':
        return parseFloat(ethers.formatEther(a.fee)) - parseFloat(ethers.formatEther(b.fee));
      default:
        return 0;
    }
  });

  // Calculate statistics
  const stats = {
    total: 0,
    completed: 0,
    pending: 0,
    contested: 0,
    totalFees: BigInt(0)
  };

  return (
    <>
      <Head>
        <title>Tasks | Arbius Explorer</title>
        <meta name="description" content="Browse AI tasks in the Arbius decentralized AI system." />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Tasks</h1>
          <p className="text-muted-foreground">
            Browse tasks submitted to the Arbius decentralized AI system
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                  <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <ClockIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                  <div className="text-2xl font-bold">{stats.completed.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-2xl font-bold">{stats.pending.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <ClockIcon className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Fees</div>
                  <div className="text-2xl font-bold">
                    {parseFloat(ethers.formatEther(stats.totalFees)).toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })} AIUS
                  </div>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M12 2v6.5l1 1 1-1V2" />
                    <path d="M16.8 6.8a5 5 0 0 1 0 7.1L12 18.6l-4.8-4.7a5 5 0 0 1 0-7.1 4.8 4.8 0 0 1 6.4-.4l.4.4.4-.4a4.9 4.9 0 0 1 6.4.4" />
                    <path d="M12 13v9" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by task ID, model, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contested">Contested</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="fee-high">Highest Fee</SelectItem>
                <SelectItem value="fee-low">Lowest Fee</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('table')}>
                  Table View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('cards')}>
                  Card View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground mb-4">
          Showing {sortedTasks.length} of {tasks.length} tasks
        </div>

        {/* Tasks List */}
        {loading ? (
          viewMode === 'table' ? (
            <TasksTableSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <TaskCardSkeleton key={index} />
              ))}
            </div>
          )
        ) : sortedTasks.length > 0 ? (
          viewMode === 'table' ? (
            <TasksTable tasks={sortedTasks} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 border rounded-lg bg-yellow-500/5 border-yellow-500/50">
            <AlertTriangleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Task Listing Requires an Indexer</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Enumerating all tasks from the blockchain requires an external indexing service.
              You can search for a specific task by entering its task ID in the search box above.
            </p>
            <p className="text-sm text-muted-foreground">
              Task IDs are 66-character hexadecimal strings starting with 0x
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function TasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Task ID</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <Link href={`/task/${task.id}`} className="text-primary hover:underline">
                  {truncateMiddle(task.id, 16)}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/model/${task.model}`} className="text-primary hover:underline">
                  {task.modelName || truncateMiddle(task.model, 10)}
                </Link>
              </TableCell>
              <TableCell>{ethers.formatEther(task.fee)} AIUS</TableCell>
              <TableCell>
                <Link href={`/address/${task.owner}`} className="text-primary hover:underline">
                  {truncateMiddle(task.owner, 10)}
                </Link>
              </TableCell>
              <TableCell>{formatTimeAgo(task.blocktime)}</TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Link href={`/task/${task.id}`} className="font-medium text-primary hover:underline truncate max-w-[80%]">
              {truncateMiddle(task.id, 16)}
            </Link>
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Model</div>
              <Link href={`/model/${task.model}`} className="text-sm text-primary hover:underline truncate block">
                {task.modelName || truncateMiddle(task.model, 10)}
              </Link>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Fee</div>
              <div className="text-sm font-medium">{ethers.formatEther(task.fee)} AIUS</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Owner</div>
              <Link href={`/address/${task.owner}`} className="text-sm text-primary hover:underline truncate block">
                {truncateMiddle(task.owner, 10)}
              </Link>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Created</div>
              <div className="text-sm">{formatTimeAgo(task.blocktime)}</div>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link href={`/task/${task.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Contested':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getVariant()}`}>
      {status}
    </span>
  );
}

function TasksTableSkeleton() {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Task ID</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(8)].map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

