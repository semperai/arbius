import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  SearchIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  CoinsIcon,
  ShieldCheckIcon,
  ActivityIcon,
  DollarSignIcon,
  NetworkIcon,
  FileTextIcon
} from 'lucide-react';
import { getContractInfo, getReward, getPsuedoTotalSupply, getValidatorMinimum } from '@/lib/contract';
import { ethers } from 'ethers';
import { CopyButton } from '@/components/CopyButton';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contractStats, setContractStats] = useState({
    version: 0,
    paused: false,
    totalSupply: '0',
    currentReward: '0',
    accruedFees: '0',
    validatorMinimum: '0',
    baseToken: '',
    treasury: '',
    startBlockTime: null as Date | null,
    loading: true
  });

  useEffect(() => {
    async function loadContractStats() {
      try {
        const info = await getContractInfo();
        if (!info) {
          setContractStats(prev => ({ ...prev, loading: false }));
          return;
        }

        const totalSupply = await getPsuedoTotalSupply();
        const currentReward = await getReward();
        const validatorMinimum = await getValidatorMinimum();

        setContractStats({
          version: info.version,
          paused: info.paused,
          totalSupply: totalSupply ? ethers.formatEther(totalSupply) : '0',
          currentReward: currentReward ? ethers.formatEther(currentReward) : '0',
          accruedFees: info.accruedFees,
          validatorMinimum: validatorMinimum ? ethers.formatEther(validatorMinimum) : '0',
          baseToken: info.baseToken,
          treasury: info.treasury,
          startBlockTime: info.startBlockTime,
          loading: false
        });
      } catch (error) {
        console.error('Error loading contract stats:', error);
        setContractStats(prev => ({ ...prev, loading: false }));
      }
    }

    loadContractStats();
  }, []);

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
          <h2 className="text-2xl font-bold mb-6">Network Statistics</h2>

          {/* Primary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Supply"
              value={contractStats.loading ? "..." : parseFloat(contractStats.totalSupply).toLocaleString(undefined, {maximumFractionDigits: 0})}
              description="AIUS mined"
              icon={<CoinsIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="Current Reward"
              value={contractStats.loading ? "..." : parseFloat(contractStats.currentReward).toLocaleString(undefined, {maximumFractionDigits: 4})}
              description="AIUS per solution"
              icon={<TrendingUpIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="Accrued Fees"
              value={contractStats.loading ? "..." : parseFloat(contractStats.accruedFees).toLocaleString(undefined, {maximumFractionDigits: 2})}
              description="AIUS in treasury fees"
              icon={<DollarSignIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="Status"
              value={contractStats.loading ? "..." : (contractStats.paused ? "Paused" : "Active")}
              description="Network status"
              icon={<ActivityIcon className="h-5 w-5" />}
              variant={contractStats.paused ? "destructive" : "success"}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="Validator Minimum"
              value={contractStats.loading ? "..." : parseFloat(contractStats.validatorMinimum).toLocaleString(undefined, {maximumFractionDigits: 0})}
              description="AIUS to stake"
              icon={<ShieldCheckIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="Engine Version"
              value={contractStats.loading ? "..." : `v${contractStats.version}`}
              description="Contract version"
              icon={<NetworkIcon className="h-5 w-5" />}
            />
            <MetricCard
              title="Launch Date"
              value={contractStats.loading ? "..." : contractStats.startBlockTime ? new Date(contractStats.startBlockTime).toLocaleDateString() : "N/A"}
              description="First block time"
              icon={<FileTextIcon className="h-5 w-5" />}
            />
          </div>

          {/* Contract Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Base Token (AIUS)</CardTitle>
                <CardDescription>ERC-20 token contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted/40 rounded px-2 py-1 font-mono flex-1 truncate">
                    {contractStats.loading ? "Loading..." : contractStats.baseToken}
                  </code>
                  {!contractStats.loading && contractStats.baseToken && (
                    <CopyButton text={contractStats.baseToken} label="Copy token address" size="sm" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Treasury</CardTitle>
                <CardDescription>Protocol treasury address</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted/40 rounded px-2 py-1 font-mono flex-1 truncate">
                    {contractStats.loading ? "Loading..." : contractStats.treasury}
                  </code>
                  {!contractStats.loading && contractStats.treasury && (
                    <CopyButton text={contractStats.treasury} label="Copy treasury address" size="sm" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Indexer Notice */}
          <Card className="mt-6 border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">Limited Data Available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Listing tasks, models, and validators requires an external indexer.
                    You can search for specific items by their ID or address using the search bar above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Search Instructions Section */}
      <section className="py-12 border-t">
        <div className="container px-4 mx-auto">
          <h2 className="text-2xl font-bold mb-6">How to Use the Explorer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Tasks</CardTitle>
                <CardDescription>View task details and solutions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enter a task ID (66 character hex string starting with 0x) to view task details,
                  solutions, and contestations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Models</CardTitle>
                <CardDescription>Explore AI model information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enter a model hash to view model details including fee, owner address, and emission rate.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Validators</CardTitle>
                <CardDescription>Check validator status</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enter a validator address (42 character address starting with 0x) to view staking
                  information and validator status.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

// Helper Components
function MetricCard({
  title,
  value,
  description,
  icon,
  variant = 'default'
}: {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive';
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-500/50 bg-green-500/5';
      case 'destructive':
        return 'border-red-500/50 bg-red-500/5';
      default:
        return '';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'destructive':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  return (
    <Card className={getVariantStyles()}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl sm:text-3xl font-bold break-all ${getValueColor()}`}>{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
