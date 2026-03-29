/**
 * FhirInfoRow.jsx — A single label/value row used inside FHIR resource tables.
 * Production-grade: handles empty values gracefully, applies consistent styling.
 */
import React from 'react';

const FhirInfoRow = ({ label, value, highlight = false }) => {
  const displayValue = value !== null && value !== undefined && value !== '' ? value : '—';

  return (
    <tr className={`border-b last:border-0 transition-colors ${highlight ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'hover:bg-muted/30'}`}>
      <td className="py-2.5 px-4 w-[38%] align-top">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {label}
        </span>
      </td>
      <td className="py-2.5 px-4 align-top">
        <span className="text-xs font-semibold text-foreground break-words leading-relaxed">
          {displayValue}
        </span>
      </td>
    </tr>
  );
};

export default FhirInfoRow;
