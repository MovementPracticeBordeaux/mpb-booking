'use client';

import { useFormStatus } from 'react-dom';

export default function BoutonNiveau({
  name,
  value,
  style,
  children,
}: {
  name: string;
  value: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} style={{ ...style, opacity: pending ? 0.5 : 1 }}>
      {pending ? '...' : children}
    </button>
  );
}
