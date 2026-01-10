import { memo } from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Clock, Globe, TrendingUp, Save, Loader2 } from "lucide-react";
import { useAuditConfig, useUpdateAuditConfig } from "@/hooks/use-audit-config";
import { toast } from "sonner";

const timezones = [
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
];

const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, "0")}:00`,
}));

function AuditConfigTabBase() {
  const { data: config, isLoading } = useAuditConfig();
  const updateConfig = useUpdateAuditConfig();

  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [businessStart, setBusinessStart] = useState("8");
  const [businessEnd, setBusinessEnd] = useState("18");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [volumeHourly, setVolumeHourly] = useState("50");
  const [volumeDaily, setVolumeDaily] = useState("200");

  useEffect(() => {
    if (config) {
      setDomains(config.internal_domains || []);
      setBusinessStart(config.business_hours_start.toString());
      setBusinessEnd(config.business_hours_end.toString());
      setTimezone(config.timezone);
      setVolumeHourly(config.volume_threshold_hourly.toString());
      setVolumeDaily(config.volume_threshold_daily.toString());
    }
  }, [config]);

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (domain && !domains.includes(domain)) {
      setDomains([...domains, domain]);
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setDomains(domains.filter((d) => d !== domain));
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      await updateConfig.mutateAsync({
        id: config.id,
        internal_domains: domains,
        business_hours_start: parseInt(businessStart),
        business_hours_end: parseInt(businessEnd),
        timezone,
        volume_threshold_hourly: parseInt(volumeHourly),
        volume_threshold_daily: parseInt(volumeDaily),
      });
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  if (isLoading) {
    return (
      <div role="region" aria-label="Configurações de Auditoria" className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Internal Domains */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Domínios Internos</CardTitle>
              <CardDescription>
                Emails para domínios não listados aqui serão considerados externos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Badge key={domain} variant="secondary" className="gap-1 py-1.5 px-3">
                @{domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="exemplo.com.br"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={handleAddDomain}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Horário Comercial</CardTitle>
              <CardDescription>
                Emails enviados fora deste horário gerarão alertas de horário suspeito
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Início</Label>
              <Select value={businessStart} onValueChange={setBusinessStart}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Select value={businessEnd} onValueChange={setBusinessEnd}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuso Horário</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Horário atual configurado: <strong>{businessStart.padStart(2, "0")}:00</strong> às{" "}
            <strong>{businessEnd.padStart(2, "0")}:00</strong> (finais de semana também são considerados suspeitos)
          </p>
        </CardContent>
      </Card>

      {/* Volume Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Limites de Volume</CardTitle>
              <CardDescription>
                Alertas serão gerados quando o número de emails exceder estes limites
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Limite por Hora</Label>
              <Input
                type="number"
                value={volumeHourly}
                onChange={(e) => setVolumeHourly(e.target.value)}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground">
                Alertas de alta severidade
              </p>
            </div>
            <div className="space-y-2">
              <Label>Limite Diário</Label>
              <Input
                type="number"
                value={volumeDaily}
                onChange={(e) => setVolumeDaily(e.target.value)}
                min={1}
                max={10000}
              />
              <p className="text-xs text-muted-foreground">
                Alertas de média severidade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}

export const AuditConfigTab = memo(AuditConfigTabBase);
export default AuditConfigTab;
