import { ReactNode } from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  const isMobile = useMobile();

  return (
    <div className="bg-white shadow">
      <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
        <div className={`py-6 ${isMobile ? 'space-y-4' : 'md:flex md:items-center md:justify-between'}`}>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9 sm:truncate">
              {title}
            </h2>
          </div>
          {actions && (
            <div className={isMobile ? '' : 'mt-4 flex md:mt-0 md:ml-4'}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
