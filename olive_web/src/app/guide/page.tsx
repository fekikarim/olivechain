import type { Metadata } from "next";
import { GuideView } from "@/features/guide/GuideView";

export const metadata: Metadata = { title: "Guide: OliveChain" };

export default function GuidePage() {
  return <GuideView />;
}
