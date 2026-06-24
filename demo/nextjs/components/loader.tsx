"use client"

import { Loader2Icon } from "lucide-react"
import React from "react"

export function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center">
        <Loader2Icon 
          className="animate-spin text-primary" 
          size={48} 
          aria-label="Loading"
          role="status"
        />
      </div>
    </div>
  )
}
