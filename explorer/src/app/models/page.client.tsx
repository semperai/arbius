'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { SearchIcon, SlidersIcon } from 'lucide-react';
import { Model } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { truncateMiddle } from '@/lib/utils';

export function ModelsPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);

        // In a real implementation, you would fetch models from the contract
        // For now, return empty array (requires indexer)
        setTimeout(() => {
          setModels([]);
          setLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Error fetching models:", error);
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  // Filter models based on search query
  const filteredModels = models.filter((model) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      model.addr.toLowerCase().includes(query)
    );
  });

  // Sort models based on sortBy
  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return parseInt(String(b.usage).replace(/,/g, '')) - parseInt(String(a.usage).replace(/,/g, ''));
      case 'name':
        return a.name.localeCompare(b.name);
      case 'fee-low':
        return parseFloat(ethers.formatEther(a.fee)) - parseFloat(ethers.formatEther(b.fee));
      case 'fee-high':
        return parseFloat(ethers.formatEther(b.fee)) - parseFloat(ethers.formatEther(a.fee));
      case 'success':
        return (b.successRate || 0) - (a.successRate || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Models</h1>
        <p className="text-muted-foreground">
          Browse available models in the Arbius decentralized AI system
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by model name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="fee-low">Fee (Low to High)</SelectItem>
              <SelectItem value="fee-high">Fee (High to Low)</SelectItem>
              <SelectItem value="success">Success Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <ModelCardSkeleton key={index} />
          ))}
        </div>
      ) : sortedModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No models found matching your search criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSortBy('popularity');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

function ModelCard({ model }: { model: Model }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">
          <Link href={`/model/${model.id}`} className="hover:text-primary transition-colors">
            {model.name}
          </Link>
        </CardTitle>
        <CardDescription>{truncateMiddle(model.id, 16)}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Fee:</span>
            <span className="font-medium">{ethers.formatEther(model.fee)} AIUS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usage:</span>
            <span className="font-medium">{model.usage} tasks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner:</span>
            <Link href={`/address/${model.addr}`} className="font-medium text-primary">
              {truncateMiddle(model.addr, 8)}
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success Rate:</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{model.successRate}%</span>
              <SuccessRateBadge rate={model.successRate || 0} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/model/${model.id}`} passHref className="w-full">
          <Button variant="outline" className="w-full">View Model</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function ModelCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

function SuccessRateBadge({ rate }: { rate: number }) {
  const getColor = () => {
    if (rate >= 95) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (rate >= 85) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold ${getColor()}`}>
      {rate >= 95 ? 'High' : rate >= 85 ? 'Med' : 'Low'}
    </span>
  );
}
