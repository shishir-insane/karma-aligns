import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }
export default function InputFL({label, className='', ...props}: Props) {
  return (
    <div className={`field ${className}`}>
      <input placeholder=" " {...props} />
      <label>{label}</label>
    </div>
  )
}
