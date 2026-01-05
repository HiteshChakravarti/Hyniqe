import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  separator?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 2,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  separator = false,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => {
    const num = current.toFixed(decimals);
    if (separator) {
      return formatWithSeparator(parseFloat(num));
    }
    return num;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, spring, delay, hasAnimated]);

  function formatWithSeparator(num: number): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Compact version with K, M, B formatting
interface AnimatedCompactNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  showPlus?: boolean;
  prefix?: string;
}

export function AnimatedCompactNumber({
  value,
  duration = 2,
  delay = 0,
  className = '',
  showPlus = false,
  prefix = '',
}: AnimatedCompactNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const { displayValue, suffix } = formatCompactNumber(value);

  const display = useTransform(spring, (current) => {
    return current.toFixed(displayValue % 1 === 0 ? 0 : 1);
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(displayValue);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, displayValue, spring, delay, hasAnimated]);

  function formatCompactNumber(num: number): { displayValue: number; suffix: string } {
    if (num >= 1000000000) {
      return { displayValue: num / 1000000000, suffix: 'B' };
    }
    if (num >= 1000000) {
      return { displayValue: num / 1000000, suffix: 'M' };
    }
    if (num >= 1000) {
      return { displayValue: num / 1000, suffix: 'K' };
    }
    return { displayValue: num, suffix: '' };
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
      {showPlus && '+'}
    </span>
  );
}

// Percentage version
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedPercentage({
  value,
  duration = 2,
  delay = 0,
  decimals = 0,
  className = '',
}: AnimatedPercentageProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => {
    return current.toFixed(decimals);
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(value);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, value, spring, delay, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{display}</motion.span>%
    </span>
  );
}

// Currency version
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  compact?: boolean;
  currency?: string;
}

export function AnimatedCurrency({
  value,
  duration = 2,
  delay = 0,
  className = '',
  compact = false,
  currency = '$',
}: AnimatedCurrencyProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const formatCurrency = (num: number): { value: number; suffix: string } => {
    if (!compact) return { value: num, suffix: '' };
    
    if (num >= 1000000000) {
      return { value: num / 1000000000, suffix: 'B' };
    }
    if (num >= 1000000) {
      return { value: num / 1000000, suffix: 'M' };
    }
    if (num >= 1000) {
      return { value: num / 1000, suffix: 'K' };
    }
    return { value: num, suffix: '' };
  };

  const { value: displayValue, suffix } = formatCurrency(value);

  const display = useTransform(spring, (current) => {
    if (compact && suffix) {
      return current.toFixed(displayValue % 1 === 0 ? 0 : 1);
    }
    return current.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        spring.set(displayValue);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, displayValue, spring, delay, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {currency}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
