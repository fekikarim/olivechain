import type { Metadata } from "next";
import { JourneyView } from "@/features/journey/JourneyView";

export const metadata: Metadata = { title: "Guided demo: OliveChain" };

export default function JourneyPage() {
  return <JourneyView />;
}
