import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { matchFirst } from "@/lib/variant";
import { 
  Globe2,
  Plus, 
  Trash2, 
  Search,
  MapPin,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GeoWhitelistEntry {
  id: string;
  country_code: string;
  country_name: string;
  is_active: boolean;
  created_at: string;
}

// Common countries list
const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'EC', name: 'Equador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'NL', name: 'Países Baixos' },
  { code: 'BE', name: 'Bélgica' },
  { code: 'CA', name: 'Canadá' },
  { code: 'AU', name: 'Austrália' },
  { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'Índia' },
  { code: 'ZA', name: 'África do Sul' },
  { code: 'AO', name: 'Angola' },
  { code: 'MZ', name: 'Moçambique' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function GeoWhitelistPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  // Fetch geo whitelist
  const { data: geoWhitelist, isLoading } = useQuery({
    queryKey: ['geoWhitelist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geo_whitelist')
        .select('*')
        .order('country_name', { ascending: true });

      if (error) throw error;
      return data as GeoWhitelistEntry[];
    },
  });

  // Add country
  const addMutation = useMutation({
    mutationFn: async () => {
      const country = COUNTRIES.find(c => c.code === selectedCountry);
      if (!country) throw new Error('País não encontrado');

      const { error } = await supabase.from('geo_whitelist').insert({
        country_code: country.code,
        country_name: country.name,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geoWhitelist'] });
      toast.success('País adicionado à whitelist');
      setShowAddDialog(false);
      setSelectedCountry('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao adicionar país');
    },
  });

  // Toggle country status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('geo_whitelist')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geoWhitelist'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar status');
    },
  });

  // Remove country
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('geo_whitelist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geoWhitelist'] });
      toast.success('País removido da whitelist');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao remover país');
    },
  });

  const filteredCountries = geoWhitelist?.filter(entry =>
    entry.country_name.toLowerCase().includes(search.toLowerCase()) ||
    entry.country_code.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = geoWhitelist?.filter(e => e.is_active).length || 0;
  const availableCountries = COUNTRIES.filter(
    c => !geoWhitelist?.some(g => g.country_code === c.code)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Bloqueio Geográfico</CardTitle>
              <CardDescription>
                Países permitidos para acessar o sistema (whitelist global)
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} disabled={availableCountries.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar País
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info banner */}
        {activeCount === 0 && (
          <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Bloqueio desativado</p>
              <p className="text-sm text-muted-foreground">
                Nenhum país na whitelist. Todos os países são permitidos.
              </p>
            </div>
          </div>
        )}

        {activeCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <MapPin className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">Bloqueio ativo</p>
              <p className="text-sm text-muted-foreground">
                Apenas {activeCount} país(es) permitido(s). Acessos de outros países serão bloqueados.
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {matchFirst([
  [isLoading, () => ((
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ))],
  [filteredCountries?.length === 0, () => ((
          <div className="text-center py-8 text-muted-foreground">
            {geoWhitelist?.length === 0 
              ? 'Nenhum país na whitelist. Adicione países para ativar o bloqueio.'
              : 'Nenhum país encontrado'}
          </div>
        ))],
], () => ((
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCountries?.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  entry.is_active ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFlagEmoji(entry.country_code)}</span>
                  <div>
                    <p className="font-medium text-sm">{entry.country_name}</p>
                    <p className="text-xs text-muted-foreground">{entry.country_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={entry.is_active}
                    onCheckedChange={(checked) => 
                      toggleMutation.mutate({ id: entry.id, isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Remover ${entry.country_name} da whitelist?`)) {
                        removeMutation.mutate(entry.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )))}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar País à Whitelist</DialogTitle>
            <DialogDescription>
              Apenas acessos deste país serão permitidos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um país" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{getFlagEmoji(country.code)}</span>
                        <span>{country.name}</span>
                        <span className="text-muted-foreground">({country.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!selectedCountry || addMutation.isPending}
            >
              {addMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
