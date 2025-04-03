import { Task, Model, Solution, Contestation } from '@/types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { 
  ClockIcon, 
  UserIcon, 
  BoxIcon, 
  FileIcon, 
  CheckIcon, 
  AlertTriangleIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { truncateMiddle, formatDate } from '@/lib/utils';

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [contestation, setContestation] = useState<Contestation | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTaskData() {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        
        // In a real implementation, you would connect to the contract and fetch data
        // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        // const taskData = await contract.tasks(id);
        
        // For demo purposes, we're using mock data
        setTimeout(() => {
          const mockTask = getMockTask(id);
          setTask(mockTask);
          
          if (mockTask.hasSolution) {
            setSolution(getMockSolution(id));
          }
          
          if (mockTask.hasContestation) {
            setContestation(getMockContestation(id));
          }
          
          setModel(getMockModel(mockTask.model));
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error("Error fetching task data:", err);
        setError("Failed to load task data. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchTaskData();
  }, [id]);
  
  // Display loading skeleton while data is being fetched
  if (loading) {
    return <TaskDetailSkeleton />;
  }
  
  // Display error if any
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-8">
          <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Task</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  // If task is null, display not found
  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-8">
          <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Task Not Found</h1>
          <p className="text-muted-foreground mb-4">The task ID you requested does not exist.</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Task {truncateMiddle(id as string, 16)} | Arbius Explorer</title>
        <meta name="description" content={`Details for Task ${id} on the Arbius decentralized AI system.`} />
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/tasks">Tasks</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{truncateMiddle(id as string, 8)}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            size="sm"
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </Button>
        </div>
        
        {/* Header with Task ID */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Task Details</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="px-3 py-1 text-xs">Task ID</Badge>
            <code className="text-sm bg-muted p-1 rounded font-mono">{id as string}</code>
            <TaskStatusBadge status={getTaskStatus(task)} />
          </div>
        </div>
        
        {/* Task Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
              <CardDescription>Basic details about this task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem 
                  icon={<ClockIcon className="h-4 w-4" />} 
                  label="Created" 
                  value={formatDate(task.blocktime)} 
                />
                <InfoItem 
                  icon={<UserIcon className="h-4 w-4" />} 
                  label="Owner" 
                  value={
                    <Link href={`/address/${task.owner}`} className="text-primary hover:underline">
                      {truncateMiddle(task.owner, 16)}
                    </Link>
                  } 
                />
                <InfoItem 
                  icon={<BoxIcon className="h-4 w-4" />} 
                  label="Model" 
                  value={
                    <Link href={`/models/${task.model}`} className="text-primary hover:underline">
                      {model ? model.name : truncateMiddle(task.model, 16)}
                    </Link>
                  } 
                />
                <InfoItem 
                  icon={<FileIcon className="h-4 w-4" />} 
                  label="IPFS CID" 
                  value={
                    <a 
                      href={`https://ipfs.io/ipfs/${task.cid}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {truncateMiddle(task.cid, 16)}
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  } 
                />
                <InfoItem 
                  label="Fee" 
                  value={`${ethers.formatEther(task.fee)} AIUS`} 
                />
                <InfoItem 
                  label="Version" 
                  value={task.version.toString()} 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Model Details</CardTitle>
              <CardDescription>Associated AI model information</CardDescription>
            </CardHeader>
            <CardContent>
              {model ? (
                <div className="space-y-4">
                  <InfoItem 
                    label="Model Name" 
                    value={model.name} 
                  />
                  <InfoItem 
                    label="Base Fee" 
                    value={`${ethers.formatEther(model.fee)} AIUS`} 
                  />
                  <InfoItem 
                    label="Reward Rate" 
                    value={model.rate.toString()} 
                  />
                  <InfoItem 
                    label="Address" 
                    value={
                      <Link href={`/address/${model.addr}`} className="text-primary hover:underline">
                        {truncateMiddle(model.addr, 16)}
                      </Link>
                    } 
                  />
                  <div className="pt-4">
                    <Link href={`/models/${task.model}`} passHref>
                      <Button variant="outline" size="sm" className="w-full">View Model Details</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Model information not available</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Task Status Tabs - Solution, Contestation, etc. */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="solution" disabled={!solution}>Solution</TabsTrigger>
            <TabsTrigger value="contestation" disabled={!contestation}>Contestation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Timeline</CardTitle>
                <CardDescription>Progression of this task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <TimelineItem 
                    title="Task Created" 
                    date={formatDate(task.blocktime)} 
                    description={`Task created by ${truncateMiddle(task.owner, 16)} with a fee of ${ethers.formatEther(task.fee)} AIUS`}
                    status="complete"
                  />
                  
                  {solution ? (
                    <TimelineItem 
                      title="Solution Submitted" 
                      date={formatDate(solution.blocktime)} 
                      description={`Solution submitted by validator ${truncateMiddle(solution.validator, 16)}`}
                      status="complete"
                    />
                  ) : (
                    <TimelineItem 
                      title="Awaiting Solution" 
                      description="No solution has been submitted for this task yet"
                      status="pending"
                    />
                  )}
                  
                  {solution && solution.claimed ? (
                    <TimelineItem 
                      title="Reward Claimed" 
                      date={formatDate(solution.claimedAt!)} 
                      description={`Validator ${truncateMiddle(solution.validator, 16)} claimed the reward`}
                      status="complete"
                    />
                  ) : solution ? (
                    <TimelineItem 
                      title="Awaiting Claim" 
                      description="Solution submitted but reward not yet claimed"
                      status="pending"
                    />
                  ) : null}
                  
                  {contestation ? (
                    <TimelineItem 
                      title="Solution Contested" 
                      date={formatDate(contestation.blocktime)} 
                      description={`Contestation initiated by validator ${truncateMiddle(contestation.validator, 16)}`}
                      status="alert"
                    />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="solution" className="space-y-4">
            {solution && (
              <Card>
                <CardHeader>
                  <CardTitle>Solution Details</CardTitle>
                  <CardDescription>Information about the submitted solution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem 
                      label="Validator" 
                      value={
                        <Link href={`/address/${solution.validator}`} className="text-primary hover:underline">
                          {truncateMiddle(solution.validator, 16)}
                        </Link>
                      } 
                    />
                    <InfoItem 
                      label="Submitted" 
                      value={formatDate(solution.blocktime)} 
                    />
                    <InfoItem 
                      label="Status" 
                      value={solution.claimed ? "Claimed" : "Pending Claim"} 
                    />
                    <InfoItem 
                      label="IPFS CID" 
                      value={
                        <a 
                          href={`https://ipfs.io/ipfs/${solution.cid}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {truncateMiddle(solution.cid, 16)}
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      } 
                    />
                    {solution.claimed && (
                      <InfoItem 
                        label="Claimed At" 
                        value={formatDate(solution.claimedAt!)} 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="contestation" className="space-y-4">
            {contestation && (
              <Card>
                <CardHeader>
                  <CardTitle>Contestation Details</CardTitle>
                  <CardDescription>Information about the contestation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem 
                      label="Contesting Validator" 
                      value={
                        <Link href={`/address/${contestation.validator}`} className="text-primary hover:underline">
                          {truncateMiddle(contestation.validator, 16)}
                        </Link>
                      } 
                    />
                    <InfoItem 
                      label="Submitted" 
                      value={formatDate(contestation.blocktime)} 
                    />
                    <InfoItem 
                      label="Slash Amount" 
                      value={`${ethers.formatEther(contestation.slashAmount)} AIUS`} 
                    />
                    <InfoItem 
                      label="Finish Start Index" 
                      value={contestation.finish_start_index.toString()} 
                    />
                    <InfoItem 
                      label="Status" 
                      value={contestation.status} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {contestation && (
              <Card>
                <CardHeader>
                  <CardTitle>Voting Results</CardTitle>
                  <CardDescription>Current status of validator votes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Votes In Favor:</span>
                      <Badge variant="outline">{contestation.votesYea}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Votes Against:</span>
                      <Badge variant="outline">{contestation.votesNay}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vote Period Ends:</span>
                      <span>{formatDate(contestation.voteEndTime)}</span>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="font-medium mb-2">Recent Votes</h4>
                      <div className="border rounded-md divide-y">
                        {contestation.recentVotes!.map((vote, index) => (
                          <div key={index} className="p-3 flex justify-between items-center">
                            <Link href={`/address/${vote.validator}`} className="text-primary hover:underline">
                              {truncateMiddle(vote.validator, 16)}
                            </Link>
                            <Badge variant={vote.vote === 'Yea' ? 'default' : 'destructive'}>
                              {vote.vote}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
        </Tabs>
      </div>
    </>
  );
}

// Helper Components
function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-start space-x-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div className={icon ? "" : "w-full flex justify-between"}>
        <span className="text-muted-foreground">{label}:</span>
        <div className={icon ? "font-medium mt-1" : "font-medium text-right"}>{value}</div>
      </div>
    </div>
  );
}

function TimelineItem({ title, date, description, status }: { title: string; date?: string; description: string; status: 'complete' | 'pending' | 'alert' }) {
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center"><CheckIcon className="h-3 w-3 text-primary" /></div>;
      case 'pending':
        return (
          <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          </div>
        );
      case 'alert':
        return <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center"><AlertTriangleIcon className="h-3 w-3 text-amber-500" /></div>;
    }
  };
  
  return (
    <div className="flex">
      <div className="mr-4 flex flex-col items-center">
        {getStatusIcon()}
        {status !== 'alert' && <div className="w-px h-full bg-border/40 mt-2"></div>}
      </div>
      <div className="pb-8">
        <div className="font-medium">{title}</div>
        {date && <div className="text-sm text-muted-foreground">{date}</div>}
        <div className="mt-2 text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case 'Completed':
        return 'default';
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

function TaskDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      
      <Skeleton className="h-8 w-24 mb-6" />
      
      <div className="mb-8">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Skeleton className="h-10 w-full mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex">
                  <Skeleton className="h-6 w-6 rounded-full mr-4" />
                  <div className="w-full">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function getTaskStatus(task: Task): string {
  if (!task) return 'Unknown';
  if (task.hasContestation) return 'Contested';
  if (task.hasSolution) {
    if (task.solutionClaimed) return 'Completed';
    return 'Pending';
  }
  return 'Pending';
}

// Mock data functions - Replace these with actual contract calls in production
function getMockTask(id: string): Task {
  return {
    id: id,
    model: '0x5c23f5ca27a3e9a75340e2282e0a853d4fe591d7',
    fee: ethers.parseEther('0.25'),
    owner: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    blocktime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    version: 1,
    cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    hasSolution: true,
    hasContestation: id.endsWith('a') ? true : false, // Just for demo variety
    solutionClaimed: id.endsWith('b') ? true : false
  };
}

function getMockSolution(id: string) {
  return {
    validator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    blocktime: Math.floor(Date.now() / 1000) - 43200, // 12 hours ago
    claimed: id.endsWith('b') ? true : false,
    claimedAt: Math.floor(Date.now() / 1000) - 21600, // 6 hours ago
    cid: 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX'
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMockContestation(id: string): Contestation {
  return {
    validator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    blocktime: Math.floor(Date.now() / 1000) - 36000, // 10 hours ago
    finish_start_index: 0,
    slashAmount: ethers.parseEther('0.05'),
    status: 'In Progress',
    votesYea: 3,
    votesNay: 2,
    voteEndTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
    recentVotes: [
      { validator: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', vote: 'Yea' },
      { validator: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', vote: 'Nay' },
      { validator: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', vote: 'Yea' },
      { validator: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', vote: 'Yea' },
      { validator: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', vote: 'Nay' }
    ]
  };
}

function getMockModel(id: string) {
  return {
    id: id,
    name: 'InferenceAI-V1',
    fee: ethers.parseEther('0.15'),
    addr: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    rate: 100,
    cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'
  };
}
