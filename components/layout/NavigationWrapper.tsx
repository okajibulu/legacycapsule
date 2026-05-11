"use client"
import { usePathname } from "next/navigation"
import Navigation from "./Navigation"

const HIDE_NAV = ["/event/", "/admin", "/book"]

export default function NavigationWrapper() {
  const pathname = usePathname()
  const hide = HIDE_NAV.some(path => pathname.startsWith(path))
  if (hide) return null
  return <Navigation />
}