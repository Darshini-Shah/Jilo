import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const getStepColor = (step) => {
  if (!step) return 'bg-muted-foreground/30';
  const s = step.toLowerCase();
  if (s.includes('pre') || s.includes('auth')) return 'bg-emerald-500';
  if (s.includes('admit')) return 'bg-orange-500';
  if (s.includes('discharge')) return 'bg-blue-500';
  if (s.includes('settle')) return 'bg-purple-500';
  return 'bg-muted-foreground/30';
};

const PatientCard = ({ patient, onSelect, onEdit, onDelete }) => {
  return (
    <Card onClick={() => onSelect(patient.id)} className="shadow-sm border border-border cursor-pointer hover:border-foreground transition-colors group rounded-sm relative overflow-hidden">
      {/* Status Strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStepColor(patient.step)} transition-colors duration-300`} />
      
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div onClick={(e) => e.stopPropagation()} className="p-1 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="w-4 h-4 cursor-pointer" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-popover text-popover-foreground shadow-xl rounded-sm">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(patient); }} className="text-xs font-bold cursor-pointer">
              <Edit2 className="mr-2 w-3.5 h-3.5" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }} className="text-xs font-bold cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 w-3.5 h-3.5" /> Delete Context
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-5 flex flex-col gap-5 pl-7 mt-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-bold text-foreground leading-tight tracking-tight text-lg group-hover:underline underline-offset-4">{patient.name}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-1 w-32 truncate" title={patient.id}>
              ID: <span className="opacity-0 w-0 h-0 inline-block overflow-hidden">{patient.id}</span>{patient.id.substring(0, 8)}...
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center font-bold text-foreground text-xs font-mono border mt-[-10px]">
            {patient.documents.length}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium border-t pt-4">
          {patient.policy_number ? (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]">Policy #{patient.policy_number}</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-widest text-[9px]"><Clock className="w-3 h-3" /> Registered Date</span>
          )}
          <span className="font-bold text-foreground font-mono">
            {patient.policy_number ? "" : (patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "-")}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PatientCard;
