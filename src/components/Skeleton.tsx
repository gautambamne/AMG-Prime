import React from 'react';
import { cn } from '../lib/utils';

/**
 * Reusable Skeleton component for premium loading states.
 */
interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("animate-pulse bg-zinc-800/50 rounded-lg", className)} />
  );
};

export const VideoCardSkeleton = () => (
  <div className="flex-shrink-0 w-64 md:w-80 rounded-xl overflow-hidden bg-zinc-900/40 border border-white/5 p-1">
    <Skeleton className="aspect-video w-full rounded-lg" />
    <div className="p-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

export const ArticleSkeleton = () => (
  <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5">
    <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-xl shrink-0" />
    <div className="flex flex-col justify-center flex-1 gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/4 mt-2" />
    </div>
  </div>
);

export default Skeleton;
