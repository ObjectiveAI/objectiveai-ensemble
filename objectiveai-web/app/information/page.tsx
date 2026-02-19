"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InformationPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/docs"); }, [router]);
  return null;
}
