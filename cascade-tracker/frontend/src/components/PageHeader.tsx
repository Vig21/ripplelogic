import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg text-gray-300">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

