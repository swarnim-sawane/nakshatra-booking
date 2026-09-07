import { Check } from "lucide-react";
import { sessionFacts } from "../config/site";

export default function TrustRow() {
  return (
    <ul className="trust-row" aria-label="Consultation facts">
      {sessionFacts.map((fact) => (
        <li key={fact}>
          <Check aria-hidden="true" size={18} strokeWidth={1.75} />
          <span>{fact}</span>
        </li>
      ))}
    </ul>
  );
}
