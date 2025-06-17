import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNext: boolean;
  loading: boolean;
  threshold?: number;
  onLoadMore: () => void;
  disabled?: boolean;
}

export const useInfiniteScroll = ({
  hasNext,
  loading,
  threshold = 200,
  onLoadMore,
  disabled = false
}: UseInfiniteScrollOptions) => {
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || loading || disabled || isLoadingRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    onLoadMore();
    
    // Reset flag after a short delay
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 1000);
  }, [hasNext, loading, disabled, onLoadMore]);

  // Scroll-based infinite scroll (fallback)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.offsetHeight;
          
          if (scrollTop + windowHeight >= documentHeight - threshold) {
            handleLoadMore();
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    if (!disabled) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleLoadMore, threshold, disabled]);

  // Intersection Observer-based infinite scroll (preferred)
  useEffect(() => {
    if (disabled || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel);
    }

    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel);
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, threshold, disabled, hasNext]);

  // Ref para el elemento sentinel
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  return { setSentinelRef };
};