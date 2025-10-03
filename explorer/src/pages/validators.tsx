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
        // For now, return empty array (requires indexer)
        setTimeout(() => {
          setValidators([]);
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

