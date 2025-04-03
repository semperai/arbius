import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  FileTextIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from 'next/router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { truncateMiddle, formatDuration } from '@/lib/utils';

// Types
interface Validator {
  address: string;
  staked: bigint;
  since: number;
  active: boolean;
  tasksValidated: number;
  successRate: number;
  pendingWithdrawals?: Array<{
    unlockTime: number;
    amount: bigint;
  }>;
}

interface Solution {
  taskHash: string;
  timestamp: number;
  claimed: boolean;
  cid: string;
  taskFee: bigint;
}

interface Contestation {
  taskHash: string;
  timestamp: number;
  status: 'ongoing' | 'won' | 'lost';
  slashAmount: bigint;
  votesFor: number;
  votesAgainst: number;
}

export default function ValidatorDetail() {
  const router = useRouter();
  const { address } = router.query;

  const [loading, setLoading] = useState(true);
  const [validator, setValidator] = useState<Validator | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [contestations, setContestations] = useState<Contestation[]>([]);
  const [initiatedContestations, setInitiatedContestations] = useState<Contestation[]>([]);

  useEffect(() => {
    if (!address) return;

    async function fetchValidatorData() {
      try {
        setLoading(true);

        // In a real implementation, you would fetch validator data from the contract
        // For now, we'll use mock data
        setTimeout(() => {
          const mockValidator = getMockValidator(address as string);
          setValidator(mockValidator);
          setSolutions(getMockSolutions(address as string));
          setContestations(getMockContestations(address as string, false));
          setInitiatedContestations(getMockContestations(address as string, true));
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Error fetching validator data:", error);
        setLoading(false);
      }
    }

    fetchValidatorData();
  }, [address]);

  // Calculate total pending withdrawals
  const totalPendingWithdrawals = validator?.pendingWithdrawals?.reduce(
    (sum, withdrawal) => sum + withdrawal.amount,
    BigInt(0)
  ) || BigInt(0);

  const stakedAmount = validator ? parseFloat(ethers.formatEther(validator.staked)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
  const pendingWithdrawalsAmount = parseFloat(ethers.formatEther(totalPendingWithdrawals)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const effectiveStake = validator ? parseFloat(ethers.formatEther(validator.staked - totalPendingWithdrawals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

  // Calculate earnings (this would come from real data in a production app)
  const totalEarnings = solutions.reduce(
    (sum, solution) => solution.claimed ? sum + solution.taskFee : sum,
    BigInt(0)
  );

  return (
    <>
      <Head>
        <title>Validator {address ? truncateMiddle(address as string, 8) : ''} | Arbius Explorer</title>
        <meta name="description" content={`Validator details for ${address} in the Arbius decentralized AI system.`} />
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
              <BreadcrumbLink href="/tasks">Validators</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{truncateMiddle(address as string, 8)}</BreadcrumbLink>
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
          <h1 className="text-3xl font-bold mb-2">Validator Details</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="px-3 py-1 text-xs">Account</Badge>
            <code className="text-sm bg-muted p-1 rounded font-mono">{address}</code>
          </div>
        </div>

        {loading ? (
          <ValidatorDetailSkeleton />
        ) : validator ? (
          <>
            {/* Validator Profile Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Address and Status */}
                  <div className="space-y-2 lg:col-span-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-medium break-all">{validator.address}</h2>
                      {validator.active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" /> Validator since {new Date(validator.since * 1000).toLocaleDateString()}
                      {" • "}
                      <span>{formatDuration(Math.floor(Date.now() / 1000) - validator.since)}</span>
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                    <div className="text-2xl font-bold">{stakedAmount} AIUS</div>
                    {totalPendingWithdrawals > BigInt(0) && (
                      <div className="text-sm text-yellow-500 flex items-center gap-1">
                        <AlertTriangleIcon className="h-3 w-3" />
                        {pendingWithdrawalsAmount} AIUS pending withdrawal
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      Effective Stake: {effectiveStake} AIUS
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Tasks Validated</div>
                    <div className="text-2xl font-bold">{validator.tasksValidated.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg {Math.round(validator.tasksValidated / (Math.floor(Date.now() / 1000) - validator.since) * 86400)} per day
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-2xl font-bold">{validator.successRate}%</div>
                    <Progress value={validator.successRate} className="h-2 w-full mt-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                    <div className="text-2xl font-bold">
                      {parseFloat(ethers.formatEther(totalEarnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })} AIUS
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From {solutions.filter(s => s.claimed).length} claimed solutions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different data views */}
            <Tabs defaultValue="solutions" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
                <TabsTrigger value="contestations">Received Contestations</TabsTrigger>
                <TabsTrigger value="initiated">Initiated Contestations</TabsTrigger>
                <TabsTrigger value="withdrawals">Pending Withdrawals</TabsTrigger>
              </TabsList>

              {/* Solutions Tab */}
              <TabsContent value="solutions">
                <Card>
                  <CardHeader>
                    <CardTitle>Solution History</CardTitle>
                    <CardDescription>Solutions submitted by this validator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {solutions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task Hash</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fee Earned</TableHead>
                            <TableHead>IPFS CID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {solutions.map((solution) => (
                            <TableRow key={solution.taskHash}>
                              <TableCell className="font-medium">
                                <Link href={`/task/${solution.taskHash}`} className="text-primary hover:underline">
                                  {truncateMiddle(solution.taskHash, 8)}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {new Date(solution.timestamp * 1000).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {solution.claimed ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    Claimed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {solution.claimed
                                  ? `${parseFloat(ethers.formatEther(solution.taskFee)).toLocaleString(undefined, { maximumFractionDigits: 4 })} AIUS`
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`https://ipfs.arbius.ai/ipfs/${solution.cid}`}
                                  target="_blank"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileTextIcon className="h-3 w-3" />
                                  {truncateMiddle(solution.cid, 8)}
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No solutions submitted by this validator yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Received Contestations Tab */}
              <TabsContent value="contestations">
                <Card>
                  <CardHeader>
                    <CardTitle>Received Contestations</CardTitle>
                    <CardDescription>Challenges against this validator&apos;s solutions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contestations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task Hash</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Slash Amount</TableHead>
                            <TableHead>Votes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contestations.map((contestation) => (
                            <TableRow key={contestation.taskHash}>
                              <TableCell className="font-medium">
                                <Link href={`/task/${contestation.taskHash}`} className="text-primary hover:underline">
                                  {truncateMiddle(contestation.taskHash, 8)}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {new Date(contestation.timestamp * 1000).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {contestation.status === 'ongoing' ? (
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                    Ongoing
                                  </Badge>
                                ) : contestation.status === 'won' ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    Rejected
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                    Confirmed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {parseFloat(ethers.formatEther(contestation.slashAmount)).toLocaleString(undefined, { maximumFractionDigits: 4 })} AIUS
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center text-green-500">
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    {contestation.votesFor}
                                  </span>
                                  <span className="flex items-center text-red-500">
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    {contestation.votesAgainst}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No contestations against this validator.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Initiated Contestations Tab */}
              <TabsContent value="initiated">
                <Card>
                  <CardHeader>
                    <CardTitle>Initiated Contestations</CardTitle>
                    <CardDescription>Challenges initiated by this validator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {initiatedContestations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task Hash</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Slash Amount</TableHead>
                            <TableHead>Votes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {initiatedContestations.map((contestation) => (
                            <TableRow key={contestation.taskHash}>
                              <TableCell className="font-medium">
                                <Link href={`/task/${contestation.taskHash}`} className="text-primary hover:underline">
                                  {truncateMiddle(contestation.taskHash, 8)}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {new Date(contestation.timestamp * 1000).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {contestation.status === 'ongoing' ? (
                                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                    Ongoing
                                  </Badge>
                                ) : contestation.status === 'won' ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    Confirmed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                    Rejected
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {parseFloat(ethers.formatEther(contestation.slashAmount)).toLocaleString(undefined, { maximumFractionDigits: 4 })} AIUS
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center text-green-500">
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    {contestation.votesFor}
                                  </span>
                                  <span className="flex items-center text-red-500">
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    {contestation.votesAgainst}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No contestations initiated by this validator.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pending Withdrawals Tab */}
              <TabsContent value="withdrawals">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Withdrawals</CardTitle>
                    <CardDescription>Withdrawal requests made by this validator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {validator.pendingWithdrawals && validator.pendingWithdrawals.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Unlock Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time Remaining</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validator.pendingWithdrawals.map((withdrawal, index) => {
                            const now = Math.floor(Date.now() / 1000);
                            const isUnlocked = now >= withdrawal.unlockTime;
                            const timeRemaining = isUnlocked ? 0 : withdrawal.unlockTime - now;

                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {parseFloat(ethers.formatEther(withdrawal.amount)).toLocaleString(undefined, { maximumFractionDigits: 4 })} AIUS
                                </TableCell>
                                <TableCell>
                                  {new Date(withdrawal.unlockTime * 1000).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {isUnlocked ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                      Ready to Claim
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                      Locked
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isUnlocked ? (
                                    <span className="text-green-500">Available now</span>
                                  ) : (
                                    formatDuration(timeRemaining)
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No pending withdrawals for this validator.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-2">Validator Not Found</h2>
            <p className="text-muted-foreground">
              The validator with address {address} could not be found.
            </p>
            <Link href="/validators">
              <Button className="mt-4">
                Return to Validators List
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function ValidatorDetailSkeleton() {
  return (
    <>
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-2 mb-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Mock data functions
function getMockValidator(address: string): Validator {
  const now = Math.floor(Date.now() / 1000);

  // For the example address, create a validator with pending withdrawals
  if (address === '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199' || address === '0x976EA74026E726554dB657fA54763abd0C3a0aa9') {
    return {
      address,
      staked: ethers.parseEther('50'),
      since: now - 10 * 24 * 60 * 60, // 10 days ago
      active: false,
      tasksValidated: 432,
      successRate: 87,
      pendingWithdrawals: [
        {
          unlockTime: now + 3 * 24 * 60 * 60, // 3 days from now
          amount: ethers.parseEther('15')
        },
        {
          unlockTime: now - 1 * 24 * 60 * 60, // 1 day ago (already unlocked)
          amount: ethers.parseEther('10')
        }
      ]
    };
  }

  // Otherwise, create a basic active validator
  return {
    address,
    staked: ethers.parseEther('180'),
    since: now - 45 * 24 * 60 * 60, // 45 days ago
    active: true,
    tasksValidated: 3124,
    successRate: 97
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMockSolutions(address: string): Solution[] {
  const now = Math.floor(Date.now() / 1000);

  return [
    {
      taskHash: ethers.keccak256(ethers.toUtf8Bytes('task1')),
      timestamp: now - 3 * 24 * 60 * 60, // 3 days ago
      claimed: true,
      cid: 'QmV9tSDx9UiPeWExXEeH6aoDvmihvx6jD5eLb4jbTaKGps',
      taskFee: ethers.parseEther('0.15')
    },
    {
      taskHash: ethers.keccak256(ethers.toUtf8Bytes('task2')),
      timestamp: now - 5 * 24 * 60 * 60, // 5 days ago
      claimed: true,
      cid: 'QmSgvgwxZGaBLqkGyLcyN7XpuJVGRhNSxvkCLnNjYUa84c',
      taskFee: ethers.parseEther('0.22')
    },
    {
      taskHash: ethers.keccak256(ethers.toUtf8Bytes('task3')),
      timestamp: now - 1 * 24 * 60 * 60, // 1 day ago
      claimed: false,
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      taskFee: ethers.parseEther('0.18')
    },
    {
      taskHash: ethers.keccak256(ethers.toUtf8Bytes('task4')),
      timestamp: now - 7 * 24 * 60 * 60, // 7 days ago
      claimed: true,
      cid: 'QmZTR5bcpQD7cFgTorqxZDYaew1Wqgfbd2ud9QqGPAkK2V',
      taskFee: ethers.parseEther('0.12')
    },
    {
      taskHash: ethers.keccak256(ethers.toUtf8Bytes('task5')),
      timestamp: now - 2 * 24 * 60 * 60, // 2 days ago
      claimed: false,
      cid: 'QmNZiPk974vDsPmQii3YbrMKfi12KTSNM7XMiYyiea4VYZ',
      taskFee: ethers.parseEther('0.25')
    }
  ];
}

function getMockContestations(address: string, initiated: boolean): Contestation[] {
  const now = Math.floor(Date.now() / 1000);

  if (initiated) {
    // Contestations initiated by this validator
    return [
      {
        taskHash: ethers.keccak256(ethers.toUtf8Bytes('contestation1')),
        timestamp: now - 6 * 24 * 60 * 60, // 6 days ago
        status: 'won',
        slashAmount: ethers.parseEther('2.5'),
        votesFor: 7,
        votesAgainst: 2
      },
      {
        taskHash: ethers.keccak256(ethers.toUtf8Bytes('contestation2')),
        timestamp: now - 2 * 24 * 60 * 60, // 2 days ago
        status: 'ongoing',
        slashAmount: ethers.parseEther('1.8'),
        votesFor: 3,
        votesAgainst: 2
      }
    ];
  } else {
    // Contestations against this validator
    return [
      {
        taskHash: ethers.keccak256(ethers.toUtf8Bytes('contestation3')),
        timestamp: now - 8 * 24 * 60 * 60, // 8 days ago
        status: 'lost',
        slashAmount: ethers.parseEther('3.0'),
        votesFor: 8,
        votesAgainst: 3
      },
      {
        taskHash: ethers.keccak256(ethers.toUtf8Bytes('contestation4')),
        timestamp: now - 4 * 24 * 60 * 60, // 4 days ago
        status: 'won',
        slashAmount: ethers.parseEther('2.2'),
        votesFor: 2,
        votesAgainst: 6
      },
      {
        taskHash: ethers.keccak256(ethers.toUtf8Bytes('contestation5')),
        timestamp: now - 1 * 24 * 60 * 60, // 1 day ago
        status: 'ongoing',
        slashAmount: ethers.parseEther('1.5'),
        votesFor: 4,
        votesAgainst: 4
      }
    ];
  }
}
