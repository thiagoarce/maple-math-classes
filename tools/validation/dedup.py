#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Detecção heurística de questões semelhantes por texto, fórmula e imagem.

Os resultados são candidatos à revisão, não prova de equivalência matemática.
"""
import hashlib
import os
import re
import unicodedata

LIMIAR_TEXTO = 0.72
MIN_TOKENS = 8            # enunciado curto demais não sustenta comparação por texto

_STOP = {"de", "da", "do", "das", "dos", "a", "o", "as", "os", "e", "em", "um", "uma",
         "que", "com", "por", "para", "no", "na", "nos", "nas", "ao", "aos", "se", "sua",
         "seu", "e", "ou", "the"}


def _sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def tokens(texto):
    # <style> e <script> não são texto do documento — e o timbre vive num `background:
    # url(data:image/png;base64,…)` dentro do <style>, ou seja, 200 KB de base64 que
    # entrariam como "palavras" do handout e afogariam a comparação.
    texto = re.sub(r"<(style|script)\b.*?</\1>", " ", texto or "", flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = re.sub(r"&[a-z]+;|&#\d+;", " ", texto)
    texto = _sem_acento(texto).lower()
    return {t for t in re.findall(r"[a-z0-9]+", texto)
            if t not in _STOP and 1 < len(t) <= 24}


MIN_FORMULA = 10          # abaixo disso a fórmula não identifica questão nenhuma
FORMULA_FORTE = 14
MIN_BYTES_IMG = 2000      # PNG minúsculo é rótulo/alternativa curta, não figura


def formulas(texto):
    """Fórmulas MathJax normalizadas, só as que têm corpo suficiente para identificar.

    Sem o corte por tamanho isto vira ruído puro: duas questões diferentes de trigonometria
    compartilham "1/2", e três questões de poliedro compartilham "α". Rodando assim o
    verificador acusou 7 repetições, todas falsas — e um verificador que grita à toa é pior
    que nenhum, porque ensina a ignorá-lo."""
    achadas = re.findall(r"\$([^$]{3,300})\$", texto or "")
    limpas = {re.sub(r"[\s{}\\]", "", f) for f in achadas}
    return {f for f in limpas if len(f) >= MIN_FORMULA}


def md5(caminho):
    try:
        if os.path.getsize(caminho) < MIN_BYTES_IMG:
            return None
        with open(caminho, "rb") as f:
            return hashlib.md5(f.read()).hexdigest()
    except OSError:
        return None


def assinatura_questao(q, imgs_dir):
    """De uma questão selecionada (dict do gerador) para a assinatura comparável."""
    texto = (q.get("enun") or "") + " " + " ".join(
        a.get("valor") or "" for a in q.get("alts") or [])
    imgs = list(q.get("imgs") or []) + [a["img"] for a in (q.get("alts") or []) if a.get("img")]
    hashes = set()
    for src in imgs:
        h = md5(os.path.join(imgs_dir, os.path.basename(src)))
        if h:
            hashes.add(h)
    return {"tokens": tokens(texto), "formulas": formulas(texto), "imagens": hashes}


def recortar_div(html, ini):
    """O <div> que começa em `ini`, fechado no </div> correspondente.

    Cortar "até o próximo bloco" parecia bastar e não bastava: o pedaço engolia o rodapé
    e o cabeçalho da página seguinte, e aí duas questões quaisquer passavam a compartilhar
    o título da lista e a data. A semelhança media o timbre, não a questão."""
    prof, i, n = 0, ini, len(html)
    while i < n:
        if html.startswith("<div", i):
            prof += 1
            i += 4
            continue
        if html.startswith("</div", i):
            prof -= 1
            i += 5
            if prof == 0:
                return html[ini:i + 1]
            continue
        i += 1
    return html[ini:]


def assinatura_texto(texto, arquivos_img=()):
    return {"tokens": tokens(texto), "formulas": formulas(texto),
            "imagens": {h for h in (md5(f) for f in arquivos_img) if h}}


def iguais(a, b):
    """(bool, motivo) — a e b são a mesma questão?"""
    comuns_img = a["imagens"] & b["imagens"]
    if comuns_img:
        return True, "mesma imagem"
    comuns_f = a["formulas"] & b["formulas"]
    fortes = [f for f in comuns_f if len(f) >= FORMULA_FORTE]
    if fortes or len(comuns_f) >= 2:
        return True, "mesma fórmula (%s)" % sorted(fortes or comuns_f)[0][:40]
    ta, tb = a["tokens"], b["tokens"]
    if len(ta) < MIN_TOKENS or len(tb) < MIN_TOKENS:
        return False, ""
    j = len(ta & tb) / float(len(ta | tb))
    if j >= LIMIAR_TEXTO:
        return True, "texto %.0f%% igual" % (j * 100)
    return False, ""


def assinaturas_do_handout(pasta_aula):
    """Assinatura de cada bloco do handout da aula (exemplos, exercícios, QD).

    É o que impede a lista de repetir o exemplo que o professor já resolveu no quadro —
    o terceiro defeito apontado. Sem isto, a lista "revisa" com a conta que a turma viu
    pronta, o que não exercita nada."""
    caminho = os.path.join(pasta_aula, "handout.html")
    if not os.path.isfile(caminho):
        return []
    html = open(caminho, encoding="utf-8", errors="replace").read()
    # Não dá para casar por NOME de classe: cada geração de handout usou o seu conjunto
    # (`ex`/`bex` nos novos, `qbox`/`qtext`/`conc` nos adotados de `old/`), e foi
    # justamente por isso que a primeira versão deste verificador não viu nada no handout
    # da Revisão CD2. O corte é estrutural: cada <div> vira um pedaço, e vale como bloco
    # comparável quem tiver texto suficiente para ser um exemplo ou uma questão.
    assinaturas = []
    for m in re.finditer(r"<div\b", html):
        trecho = recortar_div(html, m.start())
        imgs = [os.path.join(pasta_aula, s) for s in
                re.findall(r'src="(assets/[^"]+)"', trecho)]
        a = assinatura_texto(trecho, imgs)
        if len(a["tokens"]) >= MIN_TOKENS or a["imagens"] or a["formulas"]:
            assinaturas.append(a)
    return assinaturas
