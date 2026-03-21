import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, XCircle, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

const BUCKET = "images";
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export default function AdminUpload() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [folder, setFolder] = useState("plantas");
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setUploads((prev) => [...prev, ...items]);
  }, []);

  const uploadFile = async (item: UploadItem) => {
    if (item.file.size > MAX_SIZE) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: "error", error: "Arquivo excede 500MB" } : u
        )
      );
      return;
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, status: "uploading", progress: 0 } : u))
    );

    const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${sanitizedName}`;

    // Simulate progress since supabase-js doesn't expose upload progress natively
    const progressInterval = setInterval(() => {
      setUploads((prev) =>
        prev.map((u) => {
          if (u.id === item.id && u.status === "uploading" && u.progress < 90) {
            return { ...u, progress: u.progress + Math.random() * 15 };
          }
          return u;
        })
      );
    }, 300);

    const { error } = await supabase.storage.from(BUCKET).upload(path, item.file, {
      cacheControl: "3600",
      upsert: false,
    });

    clearInterval(progressInterval);

    if (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: "error", progress: 0, error: error.message } : u
        )
      );
      toast.error(`Falha: ${sanitizedName}`);
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: "done", progress: 100, url: data.publicUrl } : u
        )
      );
      toast.success(`Enviado: ${sanitizedName}`);
    }
  };

  const uploadAll = async () => {
    const pending = uploads.filter((u) => u.status === "pending");
    for (const item of pending) {
      await uploadFile(item);
    }
  };

  const removeItem = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  const pendingCount = uploads.filter((u) => u.status === "pending").length;
  const doneCount = uploads.filter((u) => u.status === "done").length;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Upload de Imagens</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Envie imagens diretamente para o armazenamento na nuvem (máx. 500MB por arquivo).
      </p>

      {/* Folder selector */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Pasta de destino</label>
        <input
          type="text"
          value={folder}
          onChange={(e) => setFolder(e.target.value.replace(/[^a-zA-Z0-9_/\-]/g, ""))}
          placeholder="ex: plantas, projetos/3d"
          className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
        `}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Arraste arquivos aqui ou <span className="text-primary font-medium">clique para selecionar</span>
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Actions */}
      {uploads.length > 0 && (
        <div className="flex items-center gap-3 mt-6 mb-4">
          <Button onClick={uploadAll} disabled={pendingCount === 0} size="sm">
            Enviar {pendingCount > 0 ? `(${pendingCount})` : "tudo"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {doneCount}/{uploads.length} concluídos
          </span>
        </div>
      )}

      {/* File list */}
      <div className="space-y-3 mt-4">
        {uploads.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            {/* Thumbnail */}
            <div className="h-12 w-12 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
              {item.file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(item.file)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(item.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {item.status === "uploading" && (
                <Progress value={Math.min(item.progress, 100)} className="mt-1 h-1.5" />
              )}
              {item.status === "error" && (
                <p className="text-xs text-destructive mt-0.5">{item.error}</p>
              )}
              {item.status === "done" && item.url && (
                <button
                  onClick={() => copyUrl(item.url!)}
                  className="text-xs text-primary hover:underline mt-0.5 text-left truncate block max-w-full"
                >
                  {item.url}
                </button>
              )}
            </div>

            {/* Status icon */}
            <div className="shrink-0">
              {item.status === "done" && <CheckCircle className="h-5 w-5 text-primary" />}
              {item.status === "error" && <XCircle className="h-5 w-5 text-destructive" />}
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
