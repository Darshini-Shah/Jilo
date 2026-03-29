import { ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

export const STAGE_ORDER = ['preAuth', 'admitted', 'discharged', 'settled'];

export const STAGE_LABELS = {
  preAuth: 'Pre-Authorization',
  admitted: 'Admitted / Running',
  discharged: 'Discharged / Finalizing',
  settled: 'Finalized / Settled'
};

export const STAGE_ICONS = {
  preAuth: ShieldCheck,
  admitted: Activity,
  discharged: Activity, 
  settled: CheckCircle2
};
