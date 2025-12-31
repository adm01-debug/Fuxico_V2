// FUXICO - Component: DateRangeFilter
import { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presets = [
  { label: 'Hoje', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Ontem', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'Ultimos 7 dias', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Ultimos 30 dias', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'Esta semana', getValue: () => ({ from: startOfWeek(new Date(), { locale: ptBR }), to: endOfWeek(new Date(), { locale: ptBR }) }) },
  { label: 'Este mes', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
];

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (presetValue: string) => {
    const preset = presets.find(p => p.label === presetValue);
    if (preset) {
      onChange(preset.getValue());
    }
  };

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  const hasValue = value.from || value.to;

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[240px]',
              !hasValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                  {format(value.to, 'dd/MM/yy', { locale: ptBR })}
                </>
              ) : (
                format(value.from, 'dd/MM/yyyy', { locale: ptBR })
              )
            ) : (
              'Selecionar periodo'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="p-3 border-r">
              <Select onValueChange={handlePreset}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Atalhos" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => onChange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </PopoverContent>
      </Popover>

      {hasValue && (
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default DateRangeFilter;
