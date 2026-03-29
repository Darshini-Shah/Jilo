import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, FileText, Heart
} from 'lucide-react';

const STAGE_CONFIG = {
  preAuth: { label: 'Pre-Auth', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  admitted: { label: 'Admitted', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  settled: { label: 'Settled', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
};



const PatientCard = ({ patient, onSelect }) => {
  // Count docs per stage
  const stageCounts = {};
  (patient.documents || []).forEach(d => {
    stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
  });
  const totalDocs = patient.documents?.length || 0;

  return (
    <Card 
      onClick={() => onSelect(patient.id)} 
      className="shadow-sm border border-border cursor-pointer hover:border-foreground/50 hover:shadow-md transition-all duration-200 group rounded-sm overflow-hidden"
    >
      {/* Header section */}
      <div className="p-4 pb-3 border-b bg-muted/5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-foreground/15 transition-colors">
              <User className="w-4 h-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground leading-tight tracking-tight text-base group-hover:underline underline-offset-4 truncate">
                {patient.name}
              </h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono mt-0.5 truncate" title={patient.id}>
                ID: {patient.id.substring(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {patient.medical_claim && (
              <Badge variant="default" className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 h-5">
                <Heart className="w-2.5 h-2.5 mr-1" /> Claim
              </Badge>
            )}
          </div>
        </div>
      </div>



      {/* Footer — document counts */}
      <div className="px-4 py-3 border-t bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {totalDocs} {totalDocs === 1 ? 'Document' : 'Documents'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {Object.entries(stageCounts).map(([stage, count]) => {
              const config = STAGE_CONFIG[stage] || { label: stage, color: 'bg-muted text-muted-foreground' };
              return (
                <Badge key={stage} variant="outline" className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 ${config.color}`}>
                  {config.label} {count}
                </Badge>
              );
            })}
          </div>
        </div>
        {patient.created_at && (
          <p className="text-[9px] text-muted-foreground font-mono mt-1.5">
            Registered: {new Date(patient.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
    </Card>
  );
};

export default PatientCard;
