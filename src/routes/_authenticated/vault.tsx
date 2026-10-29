import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Download, FileIcon, LogOut, NotebookPen, Plus, Trash2, Upload, Vault } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({
    meta: [
      { title: "Meu cofre — Cofre Web" },
      { name: "description", content: "Suas notas e arquivos privados." },
      { property: "og:title", content: "Meu cofre" },
      { property: "og:description", content: "Notas e arquivos privados no Cofre Web." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background bg-vault">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Vault className="h-6 w-6 text-primary" /> Cofre Web
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 pb-16">
        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="mt-6">
            <Notes />
          </TabsContent>
          <TabsContent value="files" className="mt-6">
            <Files userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

type Note = { id: string; title: string; content: string; updated_at: string };

function Notes() {
  const qc = useQueryClient();
  const { data: notes = [] } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("id,title,content,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });
  const [selected, setSelected] = useState<string | null>(null);
  const current = notes.find((n) => n.id === selected) ?? null;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(current?.title ?? "");
    setContent(current?.content ?? "");
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("notes").insert({ title: "Nova nota" }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: async (id) => {
      await qc.invalidateQueries({ queryKey: ["notes"] });
      setSelected(id);
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").update({ title, content, updated_at: new Date().toISOString() }).eq("id", selected!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota salva");
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: () => toast.error("Erro ao salvar"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-3">
        <Button variant="brass" className="w-full" onClick={() => create.mutate()}>
          <Plus className="h-4 w-4" /> Nova nota
        </Button>
        <ul className="mt-3 space-y-1">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelected(n.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${n.id === selected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              >
                <div className="truncate font-medium">{n.title || "Sem título"}</div>
                <div className="font-mono text-xs text-muted-foreground">{new Date(n.updated_at).toLocaleDateString("pt-BR")}</div>
              </button>
            </li>
          ))}
          {notes.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma nota ainda.</li>}
        </ul>
      </aside>
      <section className="rounded-xl border border-border bg-card p-5">
        {current ? (
          <div className="flex h-full flex-col gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="font-display text-lg" />
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva aqui..." className="min-h-[360px] flex-1" />
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => remove.mutate(current.id)}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
              <Button variant="brass" onClick={() => save.mutate()} disabled={save.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-muted-foreground">
            <NotebookPen className="h-10 w-10 text-primary/60" />
            <p className="mt-3 text-sm">Selecione ou crie uma nota.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function Files({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: files = [] } = useQuery({
    queryKey: ["files", userId],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("vault").list(userId, { sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return data.filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("vault").upload(path, file);
      if (error) toast.error(`${file.name}: ${error.message}`);
    }
    setUploading(false);
    toast.success("Envio concluído");
    qc.invalidateQueries({ queryKey: ["files", userId] });
  }

  async function download(name: string) {
    const { data, error } = await supabase.storage.from("vault").createSignedUrl(`${userId}/${name}`, 60, { download: displayName(name) });
    if (error) return toast.error("Erro ao baixar");
    window.location.href = data.signedUrl;
  }

  async function remove(name: string) {
    const { error } = await supabase.storage.from("vault").remove([`${userId}/${name}`]);
    if (error) return toast.error("Erro ao excluir");
    qc.invalidateQueries({ queryKey: ["files", userId] });
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-card p-10 transition-colors hover:bg-accent/40"
      >
        <Upload className="h-8 w-8 text-primary" />
        <span className="mt-3 font-medium">{uploading ? "Enviando..." : "Clique ou arraste arquivos aqui"}</span>
        <span className="text-xs text-muted-foreground">Até 50 MB por arquivo</span>
      </button>
      <input ref={inputRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-3 px-4 py-3">
            <FileIcon className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{displayName(f.name)}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {formatSize(f.metadata?.size ?? 0)} · {f.created_at ? new Date(f.created_at).toLocaleDateString("pt-BR") : ""}
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => download(f.name)} aria-label="Baixar">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove(f.name)} aria-label="Excluir">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {files.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum arquivo no cofre.</div>}
      </div>
    </div>
  );
}

function displayName(name: string) {
  return name.replace(/^\d+-/, "");
}
