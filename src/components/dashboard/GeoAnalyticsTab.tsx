import { memo, useState } from 'react';
import { Globe, MapPin, ChevronDown, ChevronRight, Eye, MousePointerClick, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGeoStats, CountryStats } from '@/hooks/use-geo-stats';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Map country codes/names to flag emojis
const countryFlags: Record<string, string> = {
  'Brazil': '🇧🇷',
  'Brasil': '🇧🇷',
  'BR': '🇧🇷',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'US': '🇺🇸',
  'Portugal': '🇵🇹',
  'PT': '🇵🇹',
  'Argentina': '🇦🇷',
  'AR': '🇦🇷',
  'Mexico': '🇲🇽',
  'MX': '🇲🇽',
  'Spain': '🇪🇸',
  'ES': '🇪🇸',
  'Germany': '🇩🇪',
  'DE': '🇩🇪',
  'France': '🇫🇷',
  'FR': '🇫🇷',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'GB': '🇬🇧',
  'Canada': '🇨🇦',
  'CA': '🇨🇦',
  'Unknown': '🌍',
};

function getFlag(country: string): string {
  return countryFlags[country] || '🌍';
}

function CountryRow({ country, maxTotal }: { country: CountryStats; maxTotal: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const percentage = maxTotal > 0 ? (country.total / maxTotal) * 100 : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="group">
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              <span className="mr-2">{getFlag(country.country)}</span>
              <span className="font-medium">{country.country}</span>
              <Badge variant="secondary" className="ml-2">
                {country.cities.length} {country.cities.length === 1 ? 'cidade' : 'cidades'}
              </Badge>
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{country.opens}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{country.clicks}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-bold">{country.total}</span>
        </TableCell>
        <TableCell className="w-32">
          <Progress value={percentage} className="h-2" />
        </TableCell>
      </TableRow>
      
      <CollapsibleContent asChild>
        <>
          {country.cities.map((city, idx) => (
            <TableRow key={`${country.country}-${city.city}-${idx}`} className="bg-muted/30">
              <TableCell className="pl-12">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{city.city}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{city.opens}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{city.clicks}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{city.total}</span>
              </TableCell>
              <TableCell>
                <Progress 
                  value={(city.total / country.total) * 100} 
                  className="h-1.5" 
                />
              </TableCell>
            </TableRow>
          ))}
        </>
      </CollapsibleContent>
    </Collapsible>
  );
}

function GeoAnalyticsTabBase() {
  const { data: geoStats, isLoading, error } = useGeoStats();

  if (isLoading) {
    return (
      <div role="region" aria-label="GeoAnalyticsTab" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card role="article">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Erro ao carregar dados geográficos</p>
        </CardContent>
      </Card>
    );
  }

  const totalOpens = geoStats.reduce((acc, s) => acc + s.opens, 0);
  const totalClicks = geoStats.reduce((acc, s) => acc + s.clicks, 0);
  const totalInteractions = totalOpens + totalClicks;
  const maxTotal = geoStats.length > 0 ? geoStats[0].total : 0;

  // Prepare chart data
  const topCountries = geoStats.slice(0, 5);
  const pieData = topCountries.map((c, idx) => ({
    name: c.country,
    value: c.total,
    fill: COLORS[idx % COLORS.length],
  }));

  const barData = topCountries.map(c => ({
    country: c.country,
    opens: c.opens,
    clicks: c.clicks,
  }));

  const hasData = geoStats.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card role="article">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Países</p>
                <p className="text-3xl font-bold">{geoStats.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card role="article">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Aberturas</p>
                <p className="text-3xl font-bold">{totalOpens}</p>
              </div>
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Eye className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cliques</p>
                <p className="text-3xl font-bold">{totalClicks}</p>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <MousePointerClick className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasData ? (
        <EmptyState
          type="geo"
          title="Nenhum dado geográfico disponível"
          description="Os dados de localização serão exibidos quando houver eventos de tracking com informações geográficas."
        />
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 5 Países
                </CardTitle>
                <CardDescription>Aberturas e cliques por país</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="country" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="opens" name="Aberturas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Distribuição por País
                </CardTitle>
                <CardDescription>Proporção de interações por país</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalhamento por Região
              </CardTitle>
              <CardDescription>
                Clique em um país para ver as cidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>País / Cidade</TableHead>
                    <TableHead>Aberturas</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-32">Proporção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoStats.map((country) => (
                    <CountryRow 
                      key={country.country} 
                      country={country} 
                      maxTotal={maxTotal}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
export const GeoAnalyticsTab = memo(GeoAnalyticsTabBase);
export default GeoAnalyticsTab;
