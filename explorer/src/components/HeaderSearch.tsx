'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export function HeaderSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query) return;

    // Check if it's a hex string starting with 0x
    if (query.startsWith('0x')) {
      // If it's 42 chars (0x + 40 hex), it's likely an address
      if (query.length === 42) {
        router.push(`/address/${query}`);
      }
      // If it's 66 chars (0x + 64 hex), it could be a task ID or model hash
      // We'll try task first, the page will handle if it doesn't exist
      else if (query.length === 66) {
        router.push(`/task/${query}`);
      }
      // For other lengths, try as task ID
      else {
        router.push(`/task/${query}`);
      }

      setSearchQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} className='relative flex-1 max-w-md'>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by address, task ID, or model hash..."
          className="w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </form>
  );
}
