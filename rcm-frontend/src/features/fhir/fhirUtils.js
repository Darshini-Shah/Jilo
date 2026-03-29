/**
 * fhirUtils.js — FHIR R4 bundle parsing utilities
 * Strips all technical boilerplate and returns clean, English-readable data
 * for tabular display in the FHIRviewer.
 */

// ─── Keys that are purely technical FHIR metadata ───────────────────────────
const BLACKLIST_KEYS = new Set([
  'resourceType', 'id', 'text', 'meta', 'identifier', 'extension',
  'modifierExtension', 'implicitRules', 'language', 'contained',
  'fullUrl', 'request', 'response', 'search',
]);

/**
 * Convert camelCase / snake_case to Title Case English label.
 * e.g. "diagnosisCodeableConcept" → "Diagnosis"
 *      "productOrService"         → "Product Or Service"
 */
export const humanizeKey = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** Safe label override map — common medical abbreviations → plain English */
const LABEL_OVERRIDES = {
  diagnosisCodeableConcept: 'Diagnosis',
  productOrService:         'Service / Procedure',
  diagnosisSequence:        'Linked Diagnoses',
  use:                      'Claim Use',
  type:                     'Claim Type',
  status:                   'Status',
  created:                  'Date Created',
  priority:                 'Processing Priority',
  sequence:                 'Line #',
  gender:                   'Gender',
  birthDate:                'Date of Birth',
  family:                   'Last Name',
  given:                    'First Name(s)',
};

export const labelFor = (key) => LABEL_OVERRIDES[key] ?? humanizeKey(key);

/**
 * Resolve a CodeableConcept to a plain-English string.
 *  { coding: [{code, display, system}], text }  → prefers text, then display, then code
 */
export const resolveCodeableConcept = (concept) => {
  if (!concept || typeof concept !== 'object') return String(concept);
  if (concept.text) return concept.text;
  const first = concept.coding?.[0];
  if (first) return first.display || first.code || '';
  return '';
};

/**
 * Resolve a FHIR Reference to a human-readable string.
 * Uses display when present, otherwise strips the UUID / resource prefix.
 */
export const resolveReference = (ref) => {
  if (!ref || typeof ref !== 'object') return String(ref ?? '');
  if (ref.display) return ref.display;
  if (ref.reference) {
    const raw = ref.reference;
    // strip leading "urn:uuid:" or "Patient/" etc.
    return raw.replace(/^urn:uuid:/i, '').split('/').pop() || raw;
  }
  return '';
};

/**
 * Format any ISO date string to readable locale date.
 */
export const formatDate = (val) => {
  if (!val || typeof val !== 'string') return val;
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return val;
};

// ─── Resource-specific extractors ────────────────────────────────────────────

/**
 * Extract a flat, human-readable row list from a FHIR Patient resource.
 * Returns: Array<{ label: string, value: string }>
 */
export const extractPatientRows = (resource) => {
  const rows = [];

  // Name
  const nameObj = resource.name?.[0];
  if (nameObj) {
    const given = Array.isArray(nameObj.given)
      ? nameObj.given.join(' ')
      : nameObj.given || '';
    const full = [given, nameObj.family].filter(Boolean).join(' ');
    if (full) rows.push({ label: 'Patient Name', value: full });
  }

  if (resource.gender)    rows.push({ label: 'Gender',      value: resource.gender.charAt(0).toUpperCase() + resource.gender.slice(1) });
  if (resource.birthDate) rows.push({ label: 'Date of Birth', value: formatDate(resource.birthDate) });

  // Contact / telecom
  resource.telecom?.forEach((t) => {
    if (t.value) rows.push({ label: humanizeKey(t.use || t.system || 'Contact'), value: t.value });
  });

  // Address
  const addr = resource.address?.[0];
  if (addr) {
    const parts = [
      (addr.line || []).join(', '),
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    if (parts.length) rows.push({ label: 'Address', value: parts.join(', ') });
  }

  return rows;
};

/**
 * Extract structured data from a FHIR Claim resource.
 * Returns: { summary: Row[], diagnoses: Row[][], items: Row[][] }
 */
export const extractClaimData = (resource) => {
  const summary = [];

  if (resource.status)  summary.push({ label: 'Status',  value: resource.status.charAt(0).toUpperCase() + resource.status.slice(1) });
  if (resource.use)     summary.push({ label: 'Claim Use', value: resource.use.charAt(0).toUpperCase() + resource.use.slice(1) });

  const claimType = resolveCodeableConcept(resource.type);
  if (claimType) summary.push({ label: 'Claim Type', value: claimType.charAt(0).toUpperCase() + claimType.slice(1) });

  if (resource.created) summary.push({ label: 'Date Created', value: formatDate(resource.created) });

  const priority = resolveCodeableConcept(resource.priority);
  if (priority) summary.push({ label: 'Priority', value: priority.charAt(0).toUpperCase() + priority.slice(1) });

  const provider = resolveReference(resource.provider);
  if (provider) summary.push({ label: 'Provider / Doctor', value: provider });

  // Diagnoses
  const diagnoses = (resource.diagnosis || []).map((d) => {
    const code = d.diagnosisCodeableConcept?.coding?.[0];
    return {
      sequence: d.sequence,
      condition: resolveCodeableConcept(d.diagnosisCodeableConcept),
      icdCode:   code?.code   || '—',
      display:   code?.display || '—',
    };
  });

  // Service items
  const items = (resource.item || []).map((item) => ({
    sequence:    item.sequence,
    service:     resolveCodeableConcept(item.productOrService),
    cptCode:     item.productOrService?.coding?.[0]?.code || '—',
    linkedDx:    (item.diagnosisSequence || []).join(', ') || '—',
    unitPrice:   item.unitPrice?.value != null ? `₹ ${item.unitPrice.value}` : '—',
    quantity:    item.quantity?.value != null ? String(item.quantity.value) : '—',
    net:         item.net?.value != null ? `₹ ${item.net.value}` : '—',
  }));

  return { summary, diagnoses, items };
};

/**
 * Split a raw FHIR bundle's entries into typed resource maps.
 * Returns: { Patient?: object, Claim?: object, [type]: object }
 */
export const parseBundle = (bundle) => {
  const resourceMap = {};
  (bundle?.entry || []).forEach((entry) => {
    const res = entry?.resource;
    if (res?.resourceType) {
      resourceMap[res.resourceType] = res;
    }
  });
  return resourceMap;
};
