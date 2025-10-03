'use client';

import { Task, Model, Solution, Contestation, IncentiveEvent } from '@/types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getTask, getModel, parseIPFSCid } from '@/lib/contract';
import { fetchModelTemplate, getExpectedOutputType, ModelTemplate } from '@/lib/templates';
import {
  ClockIcon,
  UserIcon,
  BoxIcon,
  FileIcon,
  CheckIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  CoinsIcon,
  PlusCircleIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { IPFSContentRenderer } from '@/components/IPFSContentRenderer';
import { CopyButton } from '@/components/CopyButton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { truncateMiddle, formatDate } from '@/lib/utils';

export default function TaskDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [contestation, setContestation] = useState<Contestation | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [modelTemplate, setModelTemplate] = useState<ModelTemplate | null>(null);
  const [incentiveEvents, setIncentiveEvents] = useState<IncentiveEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTaskData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch task from contract
        const taskData = await getTask(id);

        if (!taskData) {
          setError("Task not found. Please verify the task ID is correct.");
          setLoading(false);
          return;
        }

        // Check if task exists (model should not be zero address)
        if (taskData.model === ethers.ZeroHash) {
          setError("Task not found. This task ID does not exist on the blockchain.");
          setLoading(false);
          return;
        }

        // Convert to UI format
        const uiTask: Task = {
          id: id,
          model: taskData.model,
          fee: taskData.fee,
          owner: taskData.owner,
          blocktime: taskData.blocktime.getTime() / 1000,
          version: taskData.version,
          cid: parseIPFSCid(taskData.cid) || '',
          hasSolution: taskData.solution.validator !== ethers.ZeroAddress,
          hasContestation: taskData.hasContestation
        };

        setTask(uiTask);

        // Set solution if it exists
        if (taskData.solution.validator !== ethers.ZeroAddress) {
          setSolution({
            validator: taskData.solution.validator,
            blocktime: taskData.solution.blocktime ? taskData.solution.blocktime.getTime() / 1000 : 0,
            claimed: taskData.solution.claimed,
            cid: parseIPFSCid(taskData.solution.cid || '') || ''
          });
        }

        // Set contestation if it exists
        if (taskData.hasContestation && taskData.contestation.validator !== ethers.ZeroAddress) {
          setContestation({
            validator: taskData.contestation.validator,
            blocktime: taskData.contestation.blocktime ? taskData.contestation.blocktime.getTime() / 1000 : 0,
            finish_start_index: taskData.contestation.finish_start_index,
            slashAmount: taskData.contestation.slashAmount,
            status: 'In Progress', // Default status
            votesYea: 0,
            votesNay: 0,
            voteEndTime: 0
          });
        }

        // Fetch model data
        const modelData = await getModel(taskData.model);
        if (modelData) {
          const modelCid = parseIPFSCid(modelData.cid) || '';
          setModel({
            id: modelData.id,
            name: `Model ${modelData.id.slice(0, 8)}`,
            fee: modelData.fee,
            addr: modelData.addr,
            rate: parseInt(modelData.rate) || 0,
            cid: modelCid
          });

          // Fetch model template using model ID (hash) - checks local cache first
          try {
            const template = await fetchModelTemplate(taskData.model);
            setModelTemplate(template);
          } catch (err) {
            console.error('Error fetching model template:', err);
            // Continue without template
          }
        }

        // Incentive events require an indexer
        setIncentiveEvents([]);

        setLoading(false);

      } catch (err) {
        console.error("Error fetching task data:", err);
        setError("Failed to load task data. Please check your connection and try again.");
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

  // Calculate the total incentives
  const totalIncentives = incentiveEvents.reduce((sum, event) => sum + event.amount, ethers.parseEther('0'));
  const isIncentiveClaimed = incentiveEvents.some(event => event.type === 'claimed');

  return (
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
            <BreadcrumbLink>{truncateMiddle(id, 8)}</BreadcrumbLink>
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
          <code className="text-sm bg-muted p-1 rounded font-mono">{id}</code>
          <CopyButton text={id} label="Copy Task ID" size="sm" />
          <TaskStatusBadge status={getTaskStatus(task)} />
          {totalIncentives > 0 && (
            <Badge variant="secondary" className="px-3 py-1 gap-1 flex items-center">
              <CoinsIcon className="h-3 w-3" /> Incentivized
            </Badge>
          )}
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
                  <div className="flex items-center gap-1">
                    <Link href={`/address/${task.owner}`} className="text-primary hover:underline">
                      {truncateMiddle(task.owner, 16)}
                    </Link>
                    <CopyButton text={task.owner} label="Copy address" size="icon" />
                  </div>
                }
              />
              <InfoItem
                icon={<BoxIcon className="h-4 w-4" />}
                label="Model"
                value={
                  <div className="flex items-center gap-1">
                    <Link href={`/model/${task.model}`} className="text-primary hover:underline">
                      {model ? model.name : truncateMiddle(task.model, 16)}
                    </Link>
                    <CopyButton text={task.model} label="Copy model hash" size="icon" />
                  </div>
                }
              />
              <InfoItem
                icon={<FileIcon className="h-4 w-4" />}
                label="IPFS CID"
                value={
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://ipfs.arbius.org/ipfs/${task.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {truncateMiddle(task.cid, 16)}
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                    <CopyButton text={task.cid} label="Copy IPFS CID" size="icon" />
                  </div>
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
              {totalIncentives > 0 && (
                <InfoItem
                  icon={<CoinsIcon className="h-4 w-4" />}
                  label="Incentive"
                  value={`${ethers.formatEther(totalIncentives)} AIUS`}
                />
              )}
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
                    <div className="flex items-center gap-1">
                      <Link href={`/address/${model.addr}`} className="text-primary hover:underline">
                        {truncateMiddle(model.addr, 16)}
                      </Link>
                      <CopyButton text={model.addr} label="Copy address" size="icon" />
                    </div>
                  }
                />
                <div className="pt-4">
                  <Link href={`/model/${task.model}`} passHref>
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

      {/* Task Status Tabs - Solution, Contestation, Incentives, etc. */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="solution" disabled={!solution}>Solution</TabsTrigger>
          <TabsTrigger value="contestation" disabled={!contestation}>Contestation</TabsTrigger>
          <TabsTrigger value="incentives" disabled={incentiveEvents.length === 0}>Incentives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Task Input Content */}
          {task.cid && task.cid.length > 0 && !task.cid.startsWith('ipfs://') && (
            <IPFSContentRenderer
              cid={task.cid}
              title="Task Input"
            />
          )}

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

                {incentiveEvents.length > 0 && incentiveEvents[0].type === 'added' && (
                  <TimelineItem
                    title="Initial Incentive Added"
                    date={formatDate(incentiveEvents[0].blocktime)}
                    description={`Initial incentive of ${ethers.formatEther(incentiveEvents[0].amount)} AIUS added by ${truncateMiddle(incentiveEvents[0].from!, 16)}`}
                    status="complete"
                  />
                )}

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

                {isIncentiveClaimed && (
                  <TimelineItem
                    title="Incentive Claimed"
                    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
                    date={formatDate(incentiveEvents.find(e => e.type === 'claimed')?.blocktime!)}
                    description={`Incentive of ${ethers.formatEther(totalIncentives)} AIUS claimed by ${truncateMiddle(incentiveEvents.find(e => e.type === 'claimed')?.to || '', 16)}`}
                    status="complete"
                  />
                )}

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
            <>
              {/* Solution Output Content */}
              {solution.cid && solution.cid.length > 0 && !solution.cid.startsWith('ipfs://') && (
                <IPFSContentRenderer
                  cid={solution.cid}
                  title="Solution Output"
                  expectedType={getExpectedOutputType(modelTemplate)}
                />
              )}

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
                        <div className="flex items-center gap-1">
                          <Link href={`/address/${solution.validator}`} className="text-primary hover:underline">
                            {truncateMiddle(solution.validator, 16)}
                          </Link>
                          <CopyButton text={solution.validator} label="Copy validator address" size="icon" />
                        </div>
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
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://ipfs.arbius.org/ipfs/${solution.cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {truncateMiddle(solution.cid, 16)}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                          <CopyButton text={solution.cid} label="Copy IPFS CID" size="icon" />
                        </div>
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
            </>
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
                      <div className="flex items-center gap-1">
                        <Link href={`/address/${contestation.validator}`} className="text-primary hover:underline">
                          {truncateMiddle(contestation.validator, 16)}
                        </Link>
                        <CopyButton text={contestation.validator} label="Copy validator address" size="icon" />
                      </div>
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

        {/* New Incentives Tab */}
        <TabsContent value="incentives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incentive Summary</CardTitle>
              <CardDescription>Additional rewards offered for this task</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/50 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                  <CoinsIcon className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-lg font-medium mb-1">Total Incentive</h3>
                  <div className="text-2xl font-bold">{ethers.formatEther(totalIncentives)} AIUS</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {isIncentiveClaimed
                      ? "Incentive has been claimed"
                      : "Available to be claimed"}
                  </div>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Additions:</span>
                      <span className="font-medium">{incentiveEvents.filter(e => e.type === 'added').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">First Added:</span>
                      <span className="font-medium">
                        {incentiveEvents.length > 0 ? formatDate(incentiveEvents[0].blocktime) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Last Added:</span>
                      <span className="font-medium">
                        {incentiveEvents.length > 0
                          ? formatDate(incentiveEvents.filter(e => e.type === 'added').slice(-1)[0].blocktime)
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Claimed:</span>
                      <Badge variant={isIncentiveClaimed ? "default" : "outline"}>
                        {isIncentiveClaimed ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incentive History</CardTitle>
              <CardDescription>Chronological record of incentive changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {incentiveEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className={`mt-1 p-2 rounded-full ${event.type === 'added' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {event.type === 'added' ? (
                        <PlusCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {event.type === 'added' ? 'Incentive Added' : 'Incentive Claimed'}
                          </h4>
                          <time className="text-sm text-muted-foreground">
                            {formatDate(event.blocktime)}
                          </time>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{ethers.formatEther(event.amount)} AIUS</div>
                          <div className="text-xs text-muted-foreground">
                            TX: {truncateMiddle(event.transactionHash, 10)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        {event.type === 'added' ? (
                          <span>
                            Added by{' '}
                            <Link href={`/address/${event.from}`} className="text-primary hover:underline">
                              {truncateMiddle(event.from!, 16)}
                            </Link>
                          </span>
                        ) : (
                          <span>
                            Claimed by{' '}
                            <Link href={`/address/${event.to}`} className="text-primary hover:underline">
                              {truncateMiddle(event.to!, 16)}
                            </Link>
                            {' '}with{' '}
                            <span className="font-medium">{event.signatures?.length || 0} validator signatures</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isIncentiveClaimed && (
            <Card>
              <CardHeader>
                <CardTitle>Validator Signatures</CardTitle>
                <CardDescription>Signatures used to claim the incentive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incentiveEvents
                    .find(e => e.type === 'claimed')?.signatures?.map((signature, index) => (
                      <div key={index} className="p-3 border rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="mr-2">{index + 1}</Badge>
                          <Link href={`/address/${signature.signer}`} className="text-primary hover:underline">
                            {truncateMiddle(signature.signer, 24)}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Validated
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
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
