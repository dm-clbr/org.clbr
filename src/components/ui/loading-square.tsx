import * as React from 'react'
import { cn } from '../../lib/utils'

export function LoadingSquare({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('clbr-loading-square', className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      {/* <rect x="0.5" y="0.5" width="19" height="19" rx="2" fill="none" stroke="#333333" strokeWidth="1" /> */}
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="19"
        rx="0"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeDasharray="15 61"
        strokeLinecap="round"
        pathLength="76"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="76;0"
          keyTimes="0;1"
          calcMode="linear"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  )
}
