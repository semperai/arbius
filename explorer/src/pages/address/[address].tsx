import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { getValidator } from '@/lib/contract';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  FileTextIcon,
  AlertCircleIcon,
  ShieldIcon,
  CoinsIcon
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
import { CopyButton } from '@/components/CopyButton';

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
    if (!address || typeof address !== 'string') return;

    async function fetchValidatorData() {
      try {
        setLoading(true);

        // Fetch validator data from contract
        const validatorData = await getValidator(address as string);

        if (!validatorData) {
          // Address exists but not a validator
          setValidator({
            address: address as string,
            staked: BigInt(0),
            since: 0,
            active: false,
            tasksValidated: 0,
            successRate: 0,
            pendingWithdrawals: []
          });
          setLoading(false);
          return;
        }

        // Check if this is actually a validator (staked > 0)
        const stakedAmount = ethers.parseEther(validatorData.staked);
        const isValidator = stakedAmount > 0 || validatorData.since !== null;

        if (!isValidator) {
          // Address exists but is not a validator
          setValidator({
            address: address as string,
            staked: BigInt(0),
            since: 0,
            active: false,
            tasksValidated: 0,
            successRate: 0,
            pendingWithdrawals: []
          });
          setLoading(false);
          return;
        }

        // Convert to UI format
        setValidator({
          address: validatorData.address,
          staked: stakedAmount,
          since: validatorData.since ? validatorData.since.getTime() / 1000 : 0,
          active: validatorData.since !== null && stakedAmount > 0,
          tasksValidated: 0, // Requires indexer
          successRate: 0, // Requires indexer
          pendingWithdrawals: [] // Requires separate contract calls
        });

        // Solutions and contestations require an indexer
        setSolutions([]);
        setContestations([]);
        setInitiatedContestations([]);
        setLoading(false);

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
        <Breadcrumb className="mb-6 overflow-x-auto">
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
              <BreadcrumbLink className="max-w-[150px] sm:max-w-none truncate">
                {truncateMiddle(address as string, 8)}
              </BreadcrumbLink>
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

        {/* Header with Address */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {validator && validator.active ? 'Validator Details' : 'Address Details'}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              {validator && validator.active ? 'Validator' : 'Address'}
            </Badge>
            <code className="text-sm bg-muted p-1 rounded font-mono">{address}</code>
            <CopyButton text={address as string} label="Copy address" size="sm" />
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
                      <h2 className="text-lg sm:text-xl font-medium break-all">{validator.address}</h2>
                      {validator.active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Inactive</Badge>
                      )}
                    </div>
                    {validator.since > 0 && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" /> Validator since {new Date(validator.since * 1000).toLocaleDateString()}
                        {" • "}
                        <span>{formatDuration(Math.floor(Date.now() / 1000) - validator.since)}</span>
                      </div>
                    )}
                  </div>

                  {/* Key Stats */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Staked</div>
                    <div className="text-xl sm:text-2xl font-bold break-all">{stakedAmount} AIUS</div>
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
                    <div className="text-xl sm:text-2xl font-bold">
                      {validator.tasksValidated > 0 ? validator.tasksValidated.toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {validator.tasksValidated > 0 && validator.since > 0 ? (
                        `Avg ${Math.round(validator.tasksValidated / ((Math.floor(Date.now() / 1000) - validator.since) / 86400))} per day`
                      ) : (
                        'Requires indexer'
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {validator.successRate > 0 ? `${validator.successRate}%` : 'N/A'}
                    </div>
                    {validator.successRate > 0 ? (
                      <Progress value={validator.successRate} className="h-2 w-full mt-2" />
                    ) : (
                      <div className="text-sm text-muted-foreground mt-2">Requires indexer</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                    <div className="text-xl sm:text-2xl font-bold break-all">
                      {solutions.length > 0
                        ? `${parseFloat(ethers.formatEther(totalEarnings)).toLocaleString(undefined, { maximumFractionDigits: 2 })} AIUS`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {solutions.length > 0
                        ? `From ${solutions.filter(s => s.claimed).length} claimed solutions`
                        : 'Requires indexer'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indexer Notice */}
            {validator.active && (
              <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm">Limited Data Available</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Solution history, contestations, and detailed validator activity require an external indexer.
                        The data shown above is fetched directly from the blockchain.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for different data views */}
            <Tabs defaultValue="solutions" className="mb-8">
              <TabsList className="mb-4 w-full overflow-x-auto flex-nowrap">
                <TabsTrigger value="solutions" className="whitespace-nowrap">Solutions</TabsTrigger>
                <TabsTrigger value="contestations" className="whitespace-nowrap">Received</TabsTrigger>
                <TabsTrigger value="initiated" className="whitespace-nowrap">Initiated</TabsTrigger>
                <TabsTrigger value="withdrawals" className="whitespace-nowrap">Withdrawals</TabsTrigger>
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Task Hash</TableHead>
                              <TableHead className="min-w-[180px]">Timestamp</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[120px]">Fee Earned</TableHead>
                              <TableHead className="min-w-[120px]">IPFS CID</TableHead>
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
                      </div>
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Task Hash</TableHead>
                              <TableHead className="min-w-[180px]">Timestamp</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[130px]">Slash Amount</TableHead>
                              <TableHead className="min-w-[100px]">Votes</TableHead>
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
                      </div>
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Task Hash</TableHead>
                              <TableHead className="min-w-[180px]">Timestamp</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[130px]">Slash Amount</TableHead>
                              <TableHead className="min-w-[100px]">Votes</TableHead>
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
                      </div>
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
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">Amount</TableHead>
                              <TableHead className="min-w-[180px]">Unlock Time</TableHead>
                              <TableHead className="min-w-[120px]">Status</TableHead>
                              <TableHead className="min-w-[150px]">Time Remaining</TableHead>
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
                      </div>
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-muted">
                  <ShieldIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Not a Validator</CardTitle>
                  <CardDescription>This address has no staked AIUS tokens</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Staked Amount</span>
                  </div>
                  <div className="text-2xl font-bold">0 AIUS</div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    This address has not staked any AIUS tokens and is therefore not registered as a validator
                    in the Arbius network.
                  </p>
                  <p>
                    To become a validator and earn rewards by validating AI inference tasks, this address would need
                    to stake the minimum required amount of AIUS tokens.
                  </p>
                </div>

                <div className="pt-4">
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Return to Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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

