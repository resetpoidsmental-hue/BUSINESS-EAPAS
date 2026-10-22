import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statutIntegrations } from "@/lib/integrations";

/**
 * Lecture seule : indique si chaque intégration optionnelle est prête, sans jamais afficher les
 * clés elles-mêmes (ni en clair, ni partiellement) — seul leur statut présent/absent est lu. Pour
 * configurer ou corriger, le geste reste le même qu'avant : modifier le fichier .env sur le
 * serveur puis redéployer.
 */
export function IntegrationsStatus() {
  const integrations = statutIntegrations();

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm font-semibold">État des intégrations</p>
        <div className="flex flex-col">
          {integrations.map((i, idx) => (
            <div
              key={i.nom}
              className={`flex flex-wrap items-start justify-between gap-3 py-3 ${idx < integrations.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-start gap-2.5">
                {i.configuree ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-sm font-medium">{i.nom}</p>
                  <p className="text-xs text-muted">{i.description}</p>
                  {!i.configuree && (
                    <p className="mt-0.5 text-xs text-muted">
                      À configurer : <code className="rounded bg-surface-muted px-1 py-0.5">{i.variables}</code>
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={i.configuree ? "success" : "warning"} className="shrink-0">
                {i.configuree ? "Configuré" : "Non configuré"}
              </Badge>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Les clés ne sont jamais affichées dans l&rsquo;application — seul leur statut présent/absent est vérifié
          côté serveur.
        </p>
      </CardContent>
    </Card>
  );
}
