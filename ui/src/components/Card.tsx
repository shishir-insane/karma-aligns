import type { PropsWithChildren, HTMLAttributes } from 'react'
export default function Card({children, className='', ...rest}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <section {...rest} className={`glass p-4 md:p-6 ${className}`}>{children}</section>
}
