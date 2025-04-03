import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ethers } from 'ethers';
import { SearchIcon, ClockIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { truncateMiddle } from "@/lib/utils";

// Validator interface
interface Validator {
  address: string;
  staked: bigint;
  since: number;
  active: boolean;
  tasksValidated: number;
  successRate: number;
  pendingWithdrawals?: number;
}

export default function ValidatorsPage() {
  const [loading, setLoading] = useState(true);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('staked');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    async function fetchValidators() {
      try {
        setLoading(true);

        // In a real implementation, you would fetch validators from the contract
        // For now, we'll use mock data
        setTimeout(() => {
          setValidators(getMockValidators());
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Error fetching validators:", error);
        setLoading(false);
      }
    }

    fetchValidators();
  }, []);

  // Filter validators based on search query and active filter
  const filteredValidators = validators.filter((validator) => {
    // First apply the active/inactive filter
    if (filterActive === 'active' && !validator.active) return false;
    if (filterActive === 'inactive' && validator.active) return false;

    // Then apply the search query
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return validator.address.toLowerCase().includes(query);
  });

  // Sort validators based on sortBy
  const sortedValidators = [...filteredValidators].sort((a, b) => {
    switch (sortBy) {
      case 'staked':
        return parseFloat(ethers.formatEther(b.staked)) - parseFloat(ethers.formatEther(a.staked));
      case 'success':
        return b.successRate - a.successRate;
      case 'tasks':
        return b.tasksValidated - a.tasksValidated;
      case 'recent':
        return b.since - a.since; // More recent validators first
      default:
        return 0;
    }
  });

  // Calculate total stats
  const totalStaked = validators.reduce(
    (sum, validator) => sum+validator.staked,
    BigInt(0)
  );

  const activeValidatorsCount = validators.filter(v => v.active).length;

  return (
    <>
      <Head>
        <title>Validators | Arbius Explorer</title>
        <meta name="description" content="Browse validators in the Arbius decentralized AI system." />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Network Validators</h1>
          <p className="text-muted-foreground">
            Browse validators securing the Arbius decentralized AI system
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Validators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{validators.length}</div>
                <div className="text-sm text-muted-foreground">
                  {activeValidatorsCount} active ({Math.round((activeValidatorsCount / validators.length) * 100)}%)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">
                  {parseFloat(ethers.formatEther(totalStaked)).toLocaleString(undefined, { maximumFractionDigits: 2 })} AIUS
                </div>
                <div className="text-sm text-muted-foreground">
                  Securing the network
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">
                  {validators.length > 0 ? Math.round(validators.reduce((sum, v) => sum + v.successRate, 0) / validators.length) : '??'}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Task validation success
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by validator address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Validators</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staked">Most Staked</SelectItem>
                <SelectItem value="success">Success Rate</SelectItem>
                <SelectItem value="tasks">Tasks Validated</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Validators List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <ValidatorCardSkeleton key={index} />
            ))}
          </div>
        ) : sortedValidators.length > 0 ? (
          <div className="space-y-4">
            {sortedValidators.map((validator) => (
              <ValidatorCard key={validator.address} validator={validator} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No validators found matching your search criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setFilterActive('all');
                setSortBy('staked');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function ValidatorCard({ validator }: { validator: Validator }) {
  const stakedAmount = parseFloat(ethers.formatEther(validator.staked)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const sinceDate = new Date(validator.since * 1000).toLocaleDateString();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Address and Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href={`/address/${validator.address}`} className="text-primary hover:underline font-medium truncate">
                {truncateMiddle(validator.address, 12)}
              </Link>
              {validator.active ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Inactive</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <ClockIcon className="h-3 w-3" /> Since {sinceDate}
            </div>
          </div>

          {/* Staked Amount */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">Staked</div>
            <div className="font-medium">{stakedAmount} AIUS</div>
          </div>

          {/* Tasks Validated */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tasks Validated</div>
            <div className="font-medium">{validator.tasksValidated.toLocaleString()}</div>
          </div>

          {/* Success Rate */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
            <div className="flex items-center gap-2">
              <div className="font-medium">{validator.successRate}%</div>
              <Progress value={validator.successRate} className="h-2 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidatorCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock data functions
function getMockValidators(): Validator[] {
  return [
    {
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      staked: ethers.parseEther('150'),
      since: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // 30 days ago
      active: true,
      tasksValidated: 2345,
      successRate: 98
    },
    {
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      staked: ethers.parseEther('220'),
      since: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60, // 60 days ago
      active: true,
      tasksValidated: 4782,
      successRate: 96
    },
    {
      address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      staked: ethers.parseEther('75'),
      since: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60, // 15 days ago
      active: true,
      tasksValidated: 987,
      successRate: 92
    },
    {
      address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      staked: ethers.parseEther('50'),
      since: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
      active: false,
      tasksValidated: 432,
      successRate: 87,
      pendingWithdrawals: 25
    },
    {
      address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      staked: ethers.parseEther('180'),
      since: Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60, // 45 days ago
      active: true,
      tasksValidated: 3124,
      successRate: 97
    },
    {
      address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      staked: ethers.parseEther('110'),
      since: Math.floor(Date.now() / 1000) - 25 * 24 * 60 * 60, // 25 days ago
      active: true,
      tasksValidated: 1876,
      successRate: 95
    },
    {
      address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      staked: ethers.parseEther('40'),
      since: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, // 5 days ago
      active: false,
      tasksValidated: 183,
      successRate: 82,
      pendingWithdrawals: 40
    }
  ];
}
