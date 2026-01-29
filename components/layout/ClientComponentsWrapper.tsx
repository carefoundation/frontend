'use client';

import dynamic from 'next/dynamic';

const WhatsAppButtonWrapper = dynamic(() => import('@/components/layout/WhatsAppButtonWrapper'), { ssr: false });
const ReduxProvider = dynamic(() => import('@/components/providers/ReduxProvider'), { ssr: false });

export default function ClientComponentsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      {children}
      <WhatsAppButtonWrapper />
    </ReduxProvider>
  );
}

