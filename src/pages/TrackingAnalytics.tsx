import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Mail, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { BackButton } from "@/components/ui/back-button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { AutoTableOptions, TrackingHistoryItem } from "@/types/tracking-history";

export default function TrackingAnalytics() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: history, isLoading } = useQuery({
    queryKey: ["tracking-history"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<TrackingHistoryItem[]>(
        "get-tracking-history",
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredHistory = history?.filter((item) => 
    item.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    if (!filteredHistory) return;
    const csv = Papa.unparse(filteredHistory);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tracking_history_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!filteredHistory) return;
    // `jspdf-autotable` estende o protótipo em runtime sem publicar tipos.
    const doc = new jsPDF() as jsPDF & {
      autoTable: (options: AutoTableOptions) => void;
    };
    doc.text("Histórico de Rastreamento de E-mails", 14, 15);
    
    const tableData = filteredHistory.map((item) => [
      item.recipient_email,
      item.subject,
      format(new Date(item.sent_at), "dd/MM/yyyy HH:mm"),
      item.open_count,
      item.click_count
    ]);

    doc.autoTable({
      head: [["Destinatário", "Assunto", "Enviado em", "Aberturas", "Cliques"]],
      body: tableData,
      startY: 25,
    });

    doc.save(`tracking_history_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => navigate("/dashboard")} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics de Tracking</h1>
              <p className="text-muted-foreground">Monitore aberturas e cliques em tempo real.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filteredHistory?.length}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={!filteredHistory?.length}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviado</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{history?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {history?.length ? Math.round((history.filter((i) => i.open_count > 0).length / history.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aberturas</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500/20" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {history?.reduce((acc: number, curr) => acc + (curr.open_count || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cliques</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {history?.reduce((acc: number, curr) => acc + (curr.click_count || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Histórico de Eventos</CardTitle>
                <CardDescription>Lista detalhada de todas as interações com seus e-mails.</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Buscar por e-mail ou assunto..."
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Aberturas</TableHead>
                      <TableHead className="text-center">Cliques</TableHead>
                      <TableHead className="text-right">Última Atividade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory?.length ? (
                      filteredHistory.map((item) => (
                        <TableRow key={item.tracking_id}>
                          <TableCell className="font-medium">{item.recipient_email}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.subject}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(item.sent_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.open_count > 0 ? "default" : "secondary"}>
                              {item.open_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={item.click_count > 0 ? "default" : "secondary"}>
                              {item.click_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {item.last_opened_at 
                              ? format(new Date(item.last_opened_at), "dd/MM HH:mm", { locale: ptBR })
                              : "Nunca"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum registro encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
