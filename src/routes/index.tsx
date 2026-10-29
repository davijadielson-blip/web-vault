import { createFileRoute, Link } from "@tanstack/react-router";
import { FileLock2, NotebookPen, ShieldCheck, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cofre Web — seus arquivos e notas, trancados" },
      { name: "description", content: "Um cofre pessoal na nuvem para guardar arquivos e notas privadas." },
      { property: "og:title", content: "Cofre Web" },
      { property: "og:description", content: "Seu cofre pessoal para arquivos e notas privadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: NotebookPen, title: "Notas privadas", text: "Escreva e edite notas que só você vê." },
  { icon: FileLock2, title: "Arquivos seguros", text: "Envie documentos, fotos e PDFs até 50 MB." },
  { icon: ShieldCheck, title: "Só você tem a chave", text: "Cada conta acessa apenas o próprio cofre." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background bg-vault">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Vault className="h-6 w-6 text-primary" /> Cofre Web
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/40 bg-card shadow-glow">
          <Vault className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold leading-tight md:text-7xl">
          Tudo o que importa,
          <br />
          <span className="bg-brass bg-clip-text text-transparent">trancado a sete chaves.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Guarde arquivos e notas privadas em um cofre pessoal, acessível de qualquer lugar.
        </p>
        <Button asChild variant="brass" size="lg" className="mt-10">
          <Link to="/auth">Abrir meu cofre</Link>
        </Button>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
