import { useId } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { OwnerDetails as Owner } from '@/lib/property-owners';

export function OwnerDetails({ value, onChange }: { value: Owner; onChange?: (value: Owner) => void }) {
  const id = useId();
  const fields = [
    { key: 'name', label: 'Nome', type: 'text' },
    { key: 'phone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'notes', label: 'Observações', type: 'text' },
  ] as const;
  return (
    <section className="mt-6 border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><LockKeyhole className="size-4 text-primary" />Dados do proprietário</h2>
      <p className="mt-1 text-xs text-muted-foreground">Confidencial · Equipe interna</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map(field => (
          <div key={field.key} className={field.key === 'notes' ? 'sm:col-span-2' : ''}>
            <label htmlFor={`${id}-${field.key}`} className="label">{field.label}</label>
            {onChange ? field.key === 'notes' ? (
              <Textarea id={`${id}-${field.key}`} value={value.notes} onChange={event => onChange({ ...value, notes: event.target.value })} />
            ) : (
              <Input id={`${id}-${field.key}`} type={field.type} value={value[field.key]} onChange={event => onChange({ ...value, [field.key]: event.target.value })} />
            ) : <p className="whitespace-pre-wrap break-words text-sm">{value[field.key] || 'Não informado'}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}