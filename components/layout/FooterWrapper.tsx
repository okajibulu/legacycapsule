"use client"
import { usePathname } from "next/navigation"
import Footer from "./Footer"

const HIDE_FOOTER = ["/event/", "/admin", "/book"]

export default function FooterWrapper() {
  const pathname = usePathname()
  const hide = HIDE_FOOTER.some(path => pathname.startsWith(path))
  if (hide) return null
  return <Footer />
}