# code-arena — Design

**Date** : 2026-06-24
**Statut** : design validé, prêt pour le plan d'implémentation
**Cible** : `code-arena.my-monkey.fr`

## Contexte & but

Plateforme de **défis de code Python à niveaux**, façon France-IOI, pour **animer une classe**.
Un éditeur Python dans le navigateur, l'élève écrit son code, on lance des tests pour
valider. Démarrage simple (« hello world ») et montée en difficulté jusqu'à du vrai algo
sur **20 niveaux**, tous accessibles d'emblée.

Conçue pour être **déployée et conservée** (pas un jetable) : on pourra rajouter des
défis/niveaux à l'avenir.

### Décisions clés (issues du brainstorming)

- **But** : parcours pédagogique à niveaux, difficulté mixte (du débutant au vrai algo).
- **20 niveaux**, **tous ouverts** dès le départ (pas de déblocage linéaire).
- **Pseudo + leaderboard live projetable** (pas de comptes, pas d'auth).
- **Exécution côté navigateur** (Pyodide) → aucun serveur d'exécution à sécuriser.

## Stack & architecture

- **Front** : Vite + React + TypeScript (convention monorepo, deploy `.monkey` en SPA → `dist/`).
- **Éditeur** : **CodeMirror 6** + langage Python + autocomplétion basique (léger, déjà éprouvé sur `papers`).
- **Exécution Python** : **Pyodide dans un Web Worker**.
  - Le worker isole l'exécution : une boucle infinie ne fige pas l'onglet.
  - **Timeout** : si le worker ne répond pas en `N` secondes, on le **termine** et on le relance.
  - Aucune exécution serveur → rien à sandboxer côté infra.
- **Backend** : **Supabase** uniquement pour le leaderboard (une table, **pas d'auth**).
- **Identité** : pseudo libre stocké en `localStorage`.

Résultat : **un site statique + une table Supabase**. Simple à déployer, simple à étendre.

## Modèle d'un niveau

Les niveaux sont des **données** versionnées dans le repo (fichier TS, pas de CMS).

```ts
type Test = { args: unknown[]; expected: unknown };

type Level = {
  id: number;                       // 1..20
  title: string;
  difficulty: "facile" | "moyen" | "difficile";
  statement: string;                // énoncé markdown
  starterCode: string;              // squelette pré-rempli dans l'éditeur
  entry: string;                    // nom de la fonction à appeler
  tests: Test[];                    // visibles (affichés à l'élève)
  hiddenTests: Test[];              // cachés → anti-hardcode de la réponse
};
```

### Convention « retourne au lieu de print »

Même les premiers niveaux utilisent une **fonction qui retourne une valeur** (pas `print`).
Plus simple à tester, installe le bon réflexe dès le début. Un type de test « sortie console »
peut être ajouté plus tard si un niveau l'exige réellement — **pas** dans la v1 (YAGNI).

## Validation des tests (dans le worker Pyodide)

1. Exécuter le code de l'élève dans Pyodide.
2. Récupérer la fonction `entry` ; l'appeler avec chaque `args`.
3. Comparer le retour à `expected`.
4. **Tests visibles** : afficher ✅/❌ par cas, avec entrée / attendu / obtenu.
   **Tests cachés** : juste comptés (n passés / n total).
5. **Niveau validé = tous les tests (visibles + cachés) verts.**
6. Erreurs Python (syntaxe, exception levée, timeout) → **message clair**, jamais de
   stack trace brute jetée à l'écran.

## Leaderboard & écran prof

### Côté élève

- En-tête : pseudo + progression (« 7/20 »).
- Grille des 20 niveaux avec état (✅ résolu / à faire), **tous accessibles**.
- Au **premier succès** d'un niveau → upsert dans Supabase.

### Supabase — une seule table, pas d'auth

```sql
cc_progress (
  pseudo     text,
  level_id   int,
  solved_at  timestamptz default now(),
  primary key (pseudo, level_id)
)
```

Upsert idempotent sur `(pseudo, level_id)` au premier succès.
Pas de score complexe : ce qui compte = **nombre de niveaux résolus** + **rapidité** (`solved_at`).

### Écran prof — route `/tableau` (à projeter)

- **Classement live** trié par nb de niveaux résolus, puis par `solved_at` le plus tôt,
  **mis à jour en temps réel** (Supabase Realtime, sans recharger).
- **Progression de la classe** : pour chaque niveau, combien d'élèves l'ont passé
  → repère visuellement les niveaux qui bloquent toute la classe.

### Anti-abus

Pseudo libre, aucune modération, aucun rate-limit. Contexte = séance de classe, pas de la
prod publique exposée. **YAGNI.**

## Découpage en unités

- **`pyodide-worker`** : charge Pyodide, expose `runTests(code, entry, tests)` → résultats
  par cas + gestion timeout/erreurs. Testable isolément.
- **`levels` (data)** : les 20 niveaux + leur typage. Pure donnée.
- **`editor`** : composant CodeMirror (code, starter, lint visuel minimal).
- **`runner-ui`** : lance les tests, affiche ✅/❌ par cas, état du niveau.
- **`progress`** : lecture/écriture localStorage + upsert Supabase.
- **`leaderboard`** : abonnement Realtime + vues classement / progression classe.

Chaque unité a une API claire et peut être comprise/testée sans lire les autres.

## Déploiement

`.monkey` à la racine de `code-arena/` :

```jsonc
{
  "target": "code-arena.my-monkey.fr",
  "source": "./dist/",
  "site": {
    "title": "Code Arena",
    "description": "Défis de code Python à niveaux.",
    "category": "tool"
  }
}
```

Build Vite local → tarball avec top-level dir → release GitHub sur `my-monkeys/code-arena`
→ pipeline monkey. (On peut aussi tourner en local le jour J via `npm run dev` si besoin.)

## Hors périmètre (v1)

- Comptes / auth / profils persistants.
- Tests « sortie console » (print) — réserve future.
- Déblocage linéaire des niveaux, indices, modération, rate-limit.
- Autres langages que Python.
