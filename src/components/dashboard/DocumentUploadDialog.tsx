import { log } from '@/lib/logger';
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Upload, Loader2 } from "lucide-react";

export function DocumentUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Generate unique document ID
      const documentId = crypto.randomUUID().slice(0, 8);
      const filePath = `${user.id}/${documentId}-${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("tracked-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from("tracked_documents")
        .insert({
          user_id: user.id,
          document_id: documentId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso!",
        description: "Documento enviado com sucesso",
      });

      // Reset form
      setFile(null);
      setRecipientName("");
      setRecipientEmail("");
      setDescription("");
      setOpen(false);

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ["tracked-documents"] });

    } catch (error) {
      log.error("Error uploading document:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="mr-2 h-4 w-4" />
          Enviar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Documento PDF</DialogTitle>
          <DialogDescription>
            Envie um PDF para rastrear quando for visualizado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="region" aria-label="Upload de Documentos" className="space-y-2">
            <Label htmlFor="file">Arquivo PDF</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Nome do Destinatário (opcional)</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email do Destinatário (opcional)</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="joao@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proposta comercial Q1 2024"
            />
          </div>

          <Button type="submit" disabled={!file || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
