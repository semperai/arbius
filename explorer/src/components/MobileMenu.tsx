'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon } from 'lucide-react';

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-l">
        <nav className="flex flex-col gap-8 mt-8 ml-4">
          <Link href="/tasks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Tasks
          </Link>
          <Link href="/models" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Models
          </Link>
          <Link href="/validators" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Validators
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
