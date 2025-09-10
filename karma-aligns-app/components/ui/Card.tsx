
import { PropsWithChildren } from 'react';
export default function Card({ children, className='' }: PropsWithChildren & {className?: string}) {
  return <section className={`ka-card ${className}`}>{children}</section>;
}
