import { CASES, toPublic } from "@/lib/cases";
import Game from "@/components/Game";

export default function Page() {
  // Server component: strips secrets before anything reaches the browser.
  const publicCases = CASES.map(toPublic);
  return <Game cases={publicCases} />;
}
