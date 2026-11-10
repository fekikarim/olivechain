import type { Metadata } from "next";
import { PeopleView } from "@/features/people/PeopleView";

export const metadata: Metadata = { title: "People: OliveChain" };

export default function PeoplePage() {
  return <PeopleView />;
}
