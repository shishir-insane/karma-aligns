import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { variant?: 'primary'|'secondary' }
export default function Button({variant='primary', className='', children, ...props}: Props) {
  const cls = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return <button {...props} className={`${cls} px-4 py-2 ${className}`}>
    {children}
  </button>
}
