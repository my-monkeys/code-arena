#!/usr/bin/env python3
# Génère src/levels.ts — les valeurs attendues sont CALCULÉES par les solutions de réf.
import json

# ---------- solutions de référence ----------
def bonjour(): return "Bonjour"
def double(n): return n * 2
def somme(a, b): return a + b
def est_pair(n): return n % 2 == 0
def maximum(a, b): return a if a > b else b
def taille(mot): return len(mot)
def somme_pairs(nombres): return sum(n for n in nombres if n % 2 == 0)
def compter_voyelles(mot): return sum(1 for c in mot if c in "aeiouy")
def inverser(s): return s[::-1]
def fizzbuzz(n):
    r = []
    for i in range(1, n + 1):
        if i % 15 == 0: r.append("FizzBuzz")
        elif i % 3 == 0: r.append("Fizz")
        elif i % 5 == 0: r.append("Buzz")
        else: r.append(i)
    return r
def est_palindrome(s): return s == s[::-1]
def factorielle(n):
    r = 1
    for i in range(2, n + 1): r *= i
    return r
def maximum_liste(nombres):
    m = nombres[0]
    for x in nombres:
        if x > m: m = x
    return m
def compter(liste, x): return sum(1 for e in liste if e == x)
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n): a, b = b, a + b
    return a
def est_premier(n):
    if n < 2: return False
    i = 2
    while i * i <= n:
        if n % i == 0: return False
        i += 1
    return True
def trier(nombres):
    a = list(nombres)
    for i in range(len(a)):
        for j in range(len(a) - 1 - i):
            if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]
    return a
def paire_somme(nombres, cible):
    for i in range(len(nombres)):
        for j in range(i + 1, len(nombres)):
            if nombres[i] + nombres[j] == cible: return [i, j]
    return None
def sont_anagrammes(a, b): return sorted(a) == sorted(b)
def max_sous_somme(nombres):
    best = cur = nombres[0]
    for x in nombres[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
# nouveaux
def valeur_absolue(n): return -n if n < 0 else n
def carre(n): return n * n
def aire_rectangle(largeur, hauteur): return largeur * hauteur
def minutes_secondes(s): return [s // 60, s % 60]
def signe(n): return -1 if n < 0 else (1 if n > 0 else 0)
def est_majeur(age): return age >= 18
def est_voyelle(c): return c in "aeiouy"
def max_de_trois(a, b, c):
    m = a
    if b > m: m = b
    if c > m: m = c
    return m
def bissextile(annee): return annee % 4 == 0 and (annee % 100 != 0 or annee % 400 == 0)
def mention(note):
    if note < 10: return "insuffisant"
    if note < 12: return "passable"
    if note < 14: return "assez bien"
    if note < 16: return "bien"
    return "très bien"
def somme_jusqua(n): return sum(range(1, n + 1))
def table_multiplication(n): return [n * i for i in range(1, 11)]
def compter_chiffres(n):
    if n == 0: return 1
    c = 0
    while n > 0:
        n //= 10
        c += 1
    return c
def puissance(base, exposant):
    r = 1
    for _ in range(exposant): r *= base
    return r
def majuscule_initiale(mot): return mot[:1].upper() + mot[1:]
def supprimer_espaces(s): return s.replace(" ", "")
def compter_caractere(s, c): return sum(1 for ch in s if ch == c)
def compter_mots(phrase): return len(phrase.split())
def moyenne_liste(nombres): return sum(nombres) / len(nombres)
def a_doublons(nombres): return len(set(nombres)) != len(nombres)

# garde-fous (attrape une solution cassée)
assert factorielle(5) == 120 and fibonacci(7) == 13 and max_sous_somme([-2,1,-3,4,-1,2,1,-5,4]) == 6
assert bissextile(2000) and not bissextile(1900) and mention(13) == "assez bien" and signe(-3) == -1
assert minutes_secondes(125) == [2,5] and puissance(2,10) == 1024 and compter_mots("  un   deux  ") == 2

# ---------- spécifications (id, titre, diff, thème, params, entry, fn, énoncé, tests, hidden) ----------
S = []
def L(id, title, diff, theme, params, fn, statement, tests, hidden):
    S.append(dict(id=id, title=title, diff=diff, theme=theme, params=params,
                  entry=fn.__name__, fn=fn, statement=statement, tests=tests, hidden=hidden))

# --- Premiers pas ---
L(1, "Bonjour", "facile", "premiers-pas", "", bonjour,
  "Écris une fonction `bonjour()` qui **retourne** la chaîne `\"Bonjour\"`.",
  [[]], [])
L(2, "Le double", "facile", "premiers-pas", "n", double,
  "Retourne le double de `n`.", [[3],[0]], [[-4]])
L(3, "Somme", "facile", "premiers-pas", "a, b", somme,
  "Retourne la somme de `a` et `b`.", [[2,3]], [[-1,1],[100,250]])
L(6, "Taille du mot", "facile", "premiers-pas", "mot", taille,
  "Retourne le nombre de caractères de la chaîne `mot`.", [["chat"],[""]], [["bonjour"]])
L(21, "Valeur absolue", "facile", "premiers-pas", "n", valeur_absolue,
  "Retourne la valeur absolue de `n` (sa version positive), **sans utiliser `abs()`**.",
  [[-5],[3],[0]], [[-100],[42]])
L(22, "Le carré", "facile", "premiers-pas", "n", carre,
  "Retourne le carré de `n` (c'est-à-dire `n × n`).", [[3],[0],[-4]], [[12],[10]])
L(23, "Aire d'un rectangle", "facile", "premiers-pas", "largeur, hauteur", aire_rectangle,
  "Retourne l'aire d'un rectangle de `largeur` sur `hauteur`.", [[3,4],[5,5]], [[0,7],[10,2]])
L(24, "Minutes et secondes", "facile", "premiers-pas", "s", minutes_secondes,
  "Convertit `s` secondes en `[minutes, secondes]`. Ex : `125` → `[2, 5]`.",
  [[125],[60],[59]], [[0],[3661]])

# --- Conditions & logique ---
L(4, "Pair ou impair", "facile", "conditions", "n", est_pair,
  "Retourne `True` si `n` est pair, sinon `False`.", [[4],[7]], [[0],[-3]])
L(5, "Le plus grand", "facile", "conditions", "a, b", maximum,
  "Retourne le plus grand des deux nombres `a` et `b`.", [[3,8],[10,2]], [[5,5],[-1,-9]])
L(25, "Le signe", "facile", "conditions", "n", signe,
  "Retourne `-1` si `n` est négatif, `1` s'il est positif, `0` s'il est nul.",
  [[-5],[0],[7]], [[-100],[42]])
L(26, "Majeur ?", "facile", "conditions", "age", est_majeur,
  "Retourne `True` si `age` est supérieur ou égal à 18.", [[18],[17],[25]], [[0],[100]])
L(27, "Est-ce une voyelle ?", "facile", "conditions", "c", est_voyelle,
  "Retourne `True` si le caractère `c` est une voyelle (`a e i o u y`, en minuscule).",
  [["a"],["b"],["y"]], [["e"],["z"]])
L(28, "Maximum de trois", "moyen", "conditions", "a, b, c", max_de_trois,
  "Retourne le plus grand des trois nombres `a`, `b`, `c` **sans utiliser `max()`**.",
  [[1,2,3],[5,1,2],[2,9,4]], [[7,7,3],[-1,-5,-2]])
L(29, "Année bissextile", "moyen", "conditions", "annee", bissextile,
  "Retourne `True` si `annee` est bissextile : divisible par 4, sauf les multiples de 100 qui ne sont pas multiples de 400.",
  [[2024],[2023],[2000],[1900]], [[2400],[2100]])
L(30, "La mention", "moyen", "conditions", "note", mention,
  "Selon `note` (sur 20), retourne : `\"insuffisant\"` (< 10), `\"passable\"` (< 12), `\"assez bien\"` (< 14), `\"bien\"` (< 16), sinon `\"très bien\"`.",
  [[8],[11],[13],[15],[18]], [[10],[16],[9]])

# --- Boucles & accumulation ---
L(7, "Somme des pairs", "moyen", "boucles", "nombres", somme_pairs,
  "Retourne la somme des nombres **pairs** de la liste `nombres`.",
  [[[1,2,3,4]],[[]]], [[[1,3,5]],[[2,4,6,8]]])
L(10, "FizzBuzz", "moyen", "boucles", "n", fizzbuzz,
  "Retourne une liste de 1 à `n`. Remplace les multiples de 3 par `\"Fizz\"`, de 5 par `\"Buzz\"`, de 15 par `\"FizzBuzz\"`.",
  [[5]], [[15]])
L(12, "Factorielle", "moyen", "boucles", "n", factorielle,
  "Retourne `n!` (factorielle de `n`). On a `0! = 1`.", [[5],[0]], [[1],[6]])
L(14, "Compter les occurrences", "moyen", "boucles", "liste, x", compter,
  "Retourne le nombre de fois où `x` apparaît dans `liste`.",
  [[[1,2,2,3,2],2],[[1,2,3],9]], [[[],1]])
L(31, "Somme jusqu'à n", "facile", "boucles", "n", somme_jusqua,
  "Retourne la somme de tous les entiers de 1 à `n` inclus. Ex : `5` → `15`.",
  [[5],[1],[0]], [[100],[10]])
L(32, "Table de multiplication", "moyen", "boucles", "n", table_multiplication,
  "Retourne la liste des 10 premiers multiples de `n` (de `n×1` à `n×10`).",
  [[2]], [[5],[1]])
L(33, "Compter les chiffres", "moyen", "boucles", "n", compter_chiffres,
  "Retourne le nombre de chiffres de l'entier `n` (`n ≥ 0`). Ex : `12345` → `5`. `0` compte pour 1 chiffre.",
  [[0],[7],[12345],[100]], [[999999],[1000000]])
L(34, "Puissance", "moyen", "boucles", "base, exposant", puissance,
  "Retourne `base` à la puissance `exposant` **sans utiliser `**` ni `pow()`**. On a `base⁰ = 1`.",
  [[2,3],[5,0],[3,2]], [[2,10],[7,1]])

# --- Chaînes de caractères ---
L(8, "Compter les voyelles", "moyen", "chaines", "mot", compter_voyelles,
  "Retourne le nombre de voyelles (`a e i o u y`) dans `mot` (en minuscules).",
  [["bonjour"],["xyz"]], [[""],["aeiouy"]])
L(9, "À l'envers", "moyen", "chaines", "s", inverser,
  "Retourne la chaîne `s` inversée.", [["abc"],[""]], [["a"],["python"]])
L(11, "Palindrome", "moyen", "chaines", "s", est_palindrome,
  "Retourne `True` si `s` se lit pareil à l'endroit et à l'envers.",
  [["kayak"],["chien"]], [[""],["ressasser"]])
L(19, "Anagrammes", "difficile", "chaines", "a, b", sont_anagrammes,
  "Retourne `True` si `a` et `b` sont des anagrammes (mêmes lettres, même nombre).",
  [["chien","niche"],["abc","abd"]], [["",""],["aab","abb"]])
L(35, "Initiale en majuscule", "facile", "chaines", "mot", majuscule_initiale,
  "Retourne `mot` avec sa **première lettre** en majuscule. Ex : `\"chat\"` → `\"Chat\"`. La chaîne peut être vide.",
  [["chat"],[""],["a"]], [["bonjour"]])
L(36, "Supprimer les espaces", "facile", "chaines", "s", supprimer_espaces,
  "Retourne `s` sans aucun espace.", [["a b c"],["  x  "],[""]], [["bonjour le monde"]])
L(37, "Compter un caractère", "moyen", "chaines", "s, c", compter_caractere,
  "Retourne le nombre de fois où le caractère `c` apparaît dans `s`.",
  [["banane","a"],["xyz","a"]], [["","a"],["aaa","a"]])
L(38, "Compter les mots", "moyen", "chaines", "phrase", compter_mots,
  "Retourne le nombre de mots de `phrase` (les mots sont séparés par des espaces ; attention aux espaces multiples).",
  [["bonjour le monde"],["salut"],[""]], [["  un   deux  "]])

# --- Listes & algorithmique ---
L(13, "Maximum d'une liste", "moyen", "algos", "nombres", maximum_liste,
  "Retourne le plus grand élément de `nombres` **sans utiliser `max()`**. La liste n'est jamais vide.",
  [[[3,7,2,9,4]]], [[[-5,-1,-10]],[[42]]])
L(15, "Fibonacci", "difficile", "algos", "n", fibonacci,
  "Retourne le `n`-ième terme de la suite de Fibonacci. `fib(0)=0`, `fib(1)=1`.",
  [[0],[1],[7]], [[10],[20]])
L(16, "Nombre premier", "difficile", "algos", "n", est_premier,
  "Retourne `True` si `n` est un nombre premier, sinon `False`.",
  [[7],[10],[1]], [[2],[97],[0]])
L(17, "Trier (sans sorted)", "difficile", "algos", "nombres", trier,
  "Retourne une **nouvelle** liste avec les éléments de `nombres` triés par ordre croissant, **sans `sorted()` ni `.sort()`**.",
  [[[3,1,2]],[[]]], [[[5,5,1,9,1]],[[-2,0,-7]]])
L(18, "Deux nombres, une cible", "difficile", "algos", "nombres, cible", paire_somme,
  "Retourne la liste `[i, j]` des indices (i < j) de deux nombres de `nombres` dont la somme vaut `cible`, ou `None`. Au plus une solution.",
  [[[2,7,11,15],9],[[1,2,3],100]], [[[3,2,4],6]])
L(20, "Somme maximale", "difficile", "algos", "nombres", max_sous_somme,
  "Retourne la somme du sous-tableau **contigu** de somme maximale (au moins un élément). Ex : `[-2,1,-3,4,-1,2,1,-5,4]` → `6`.",
  [[[-2,1,-3,4,-1,2,1,-5,4]]], [[[1]],[[-3,-1,-2]],[[5,4,-1,7,8]]])
L(39, "Moyenne d'une liste", "moyen", "algos", "nombres", moyenne_liste,
  "Retourne la moyenne des nombres de `nombres` (la liste n'est jamais vide).",
  [[[2,4,6]],[[5]],[[1,2,3,4]]], [[[10,20]]])
L(40, "Des doublons ?", "moyen", "algos", "nombres", a_doublons,
  "Retourne `True` si `nombres` contient au moins un doublon, sinon `False`.",
  [[[1,2,3]],[[1,2,2]],[[]]], [[[5,5]],[[1,2,3,4,5]]])

# ---------- émission TS ----------
def v(x): return json.dumps(x, ensure_ascii=False)
def cases(fn, lst):
    parts = []
    for args in lst:
        exp = fn(*args)
        parts.append(f"{{ args: {v(args)}, expected: {v(exp)} }}")
    return "[" + ", ".join(parts) + "]"

S.sort(key=lambda s: s["id"])
assert [s["id"] for s in S] == list(range(1, 41)), "ids 1..40 manquants/dupliqués"

out = []
out.append("// src/levels.ts — généré, ne pas éditer à la main (cf. scripts/gen_levels.py)")
out.append('import type { Level } from "./types";')
out.append("")
out.append("export const THEMES = [")
for key, label in [("premiers-pas","Premiers pas"),("conditions","Conditions & logique"),
                   ("boucles","Boucles & accumulation"),("chaines","Chaînes de caractères"),
                   ("algos","Listes & algorithmique")]:
    out.append(f'  {{ key: {v(key)}, label: {v(label)} }},')
out.append("] as const;")
out.append("")
out.append("export const LEVELS: Level[] = [")
for s in S:
    starter = f"def {s['entry']}({s['params']}):\n    pass\n"
    out.append("  {")
    out.append(f"    id: {s['id']}, title: {v(s['title'])}, difficulty: {v(s['diff'])}, theme: {v(s['theme'])},")
    out.append(f"    statement: {v(s['statement'])},")
    out.append(f"    starterCode: {v(starter)},")
    out.append(f"    entry: {v(s['entry'])},")
    out.append(f"    tests: {cases(s['fn'], s['tests'])},")
    out.append(f"    hiddenTests: {cases(s['fn'], s['hidden'])},")
    out.append("  },")
out.append("];")
out.append("")
out.append("export const TOTAL_LEVELS = LEVELS.length;")
out.append("")

import os
dst = os.path.join(os.path.dirname(__file__), "..", "levels.ts")
# écrit dans le repo
repo = "/Users/maxim/Documents/my-monkey/code-arena/src/levels.ts"
with open(repo, "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print(f"OK — {len(S)} niveaux écrits dans {repo}")
# récap par thème
from collections import Counter
c = Counter(s["theme"] for s in S)
for k in ["premiers-pas","conditions","boucles","chaines","algos"]:
    print(f"  {k}: {c[k]}")
