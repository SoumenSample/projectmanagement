"use client"

import React, { createContext, useContext, useRef, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const PersistentContext = createContext(null)

export function PersistentSkeletonProvider({ children }) {
  const [pending, setPending] = useState(0)
  const pendingRef = useRef(0)

  const register = (promise) => {
    if (!promise) return
    // Allow passing a function that returns a promise
    let p = typeof promise === "function" ? promise() : promise
    pendingRef.current += 1
    setPending(pendingRef.current)
    Promise.resolve(p)
      .catch(() => {})
      .finally(() => {
        pendingRef.current -= 1
        setPending(pendingRef.current)
      })
    return p
  }

  const [leftPx, setLeftPx] = useState(null)

  useEffect(() => {
    const update = () => {
      try {
        const el = document.querySelector('[data-slot="sidebar-container"]') || document.querySelector('[data-slot="sidebar-wrapper"]')
        if (el) {
          const rect = el.getBoundingClientRect()
          setLeftPx(Math.round(rect.left + rect.width))
          return
        }
      } catch (e) {}
      setLeftPx(null)
    }
    update()
    window.addEventListener("resize", update)
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true })
    return () => { window.removeEventListener("resize", update); mo.disconnect() }
  }, [])

  return (
    <PersistentContext.Provider value={{ register, pending }}>
      <div className="relative min-h-screen w-full">
        {children}
        {pending > 0 && (
          <div
            className="absolute top-0 right-0 bottom-0 z-[9999] flex items-start justify-center p-6"
            style={{
              left: leftPx != null ? `${leftPx}px` : "var(--sidebar-width, 16rem)",
              width: leftPx != null ? `calc(100% - ${leftPx}px)` : "calc(100% - var(--sidebar-width, 16rem))",
              backgroundColor: "rgba(12,12,12,1)",
            }}
          >
            <div className="mx-auto w-full max-w-7xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-3 max-w-[60%]">
                    <Skeleton className="h-8 w-48 rounded-full" />
                    <Skeleton className="h-5 w-72 max-w-full rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl" />
                </div>

                <Skeleton className="h-135 rounded-3xl" />
              </div>
            </div>
          </div>
        )}
      </div>
    </PersistentContext.Provider>
  )
}

export function usePersistentLoader() {
  const ctx = useContext(PersistentContext)
  if (!ctx) throw new Error("usePersistentLoader must be used within PersistentSkeletonProvider")
  return ctx.register
}

export function usePersistentPending() {
  const ctx = useContext(PersistentContext)
  if (!ctx) return 0
  return ctx.pending
}

export default PersistentSkeletonProvider
