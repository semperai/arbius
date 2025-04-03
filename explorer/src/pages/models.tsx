import { useState, useEffect } from 'react';
import Head from 'next/head';
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

export default function ModelsPage() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  
  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch models from the contract
        // For now, we'll use mock data
        setTimeout(() => {
          setModels(getMockModels());
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
    <>
      <Head>
        <title>Models | Arbius Explorer</title>
        <meta name="description" content="Browse AI models available on the Arbius decentralized AI system." />
      </Head>
      
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
    </>
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

// Helper functions
function truncateMiddle(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  const prefixLength = Math.ceil(maxLength / 2);
  const suffixLength = Math.floor(maxLength / 2);
  return `${str.slice(0, prefixLength)}...${str.slice(-suffixLength)}`;
}

// Mock data functions
function getMockModels(): Model[] {
  return [
    {
      id: '0x5c23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'Kandinsky 2',
      fee: ethers.parseEther('0.15'),
      addr: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      rate: 100,
      cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
      usage: '2,345',
      successRate: 98
    },
    {
      id: '0x8c23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'StableDiffusion-XL',
      fee: ethers.parseEther('0.25'),
      addr: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      rate: 120,
      cid: 'QmV5ZVQxXbPZudAcx6RXvH4tETtEhKL8dFzWh3jgNrUUJR',
      usage: '1,872',
      successRate: 96
    },
    {
      id: '0x9c23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'GPT-Arbius',
      fee: ethers.parseEther('0.18'),
      addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      rate: 80,
      cid: 'QmZ8yrHLBLTmQqdDdRxEYrHLcM6KAc78fZyBtvC5gB8Yrk',
      usage: '1,653',
      successRate: 94
    },
    {
      id: '0xac23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'Whisper Transcription',
      fee: ethers.parseEther('0.08'),
      addr: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      rate: 60,
      cid: 'QmS8yrHLBLTmQqdDdRxEYrHLcM6KAc78fZyBtvC5gB8Yrk',
      usage: '984',
      successRate: 99
    },
    {
      id: '0xbc23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'DALL-E 3 Clone',
      fee: ethers.parseEther('0.22'),
      addr: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      rate: 110,
      cid: 'QmT8yrHLBLTmQqdDdRxEYrHLcM6KAc78fZyBtvC5gB8Yrk',
      usage: '1,237',
      successRate: 92
    },
    {
      id: '0xcc23f5ca27a3e9a75340e2282e0a853d4fe591d7',
      name: 'ArbiusGPT-Vision',
      fee: ethers.parseEther('0.30'),
      addr: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      rate: 150,
      cid: 'QmU8yrHLBLTmQqdDdRxEYrHLcM6KAc78fZyBtvC5gB8Yrk',
      usage: '763',
      successRate: 88
    }
  ];
}
