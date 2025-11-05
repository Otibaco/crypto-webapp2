"use client"

import React from "react"
import { ReceivePage } from "../../../components/receive-page"
import { useRouter } from "next/navigation"

export default function Receive() {
  const router = useRouter()

  const handleClose = () => router.push("/dashboard")

  return <ReceivePage onClose={handleClose} />
}
