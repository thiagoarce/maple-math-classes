#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Geração de PDF a partir de HTML local com Chrome/Chromium."""
import argparse
import re
import zlib
import glob
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(DIR, "..", ".."))


def chrome_bin():
    for nome in ("google-chrome", "google-chrome-stable", "chromium",
                 "chromium-browser", "chrome", "chrome.exe", "msedge", "msedge.exe"):
        caminho = shutil.which(nome)
        if caminho:
            return caminho
    # Chrome/Edge normalmente não entram no PATH do Windows. Sem estes caminhos o
    # gerador criava o HTML, mantinha silenciosamente um PDF antigo ao lado e dava a
    # impressão de que a correção não funcionou.
    if os.name == "nt":
        bases = [
            os.environ.get("LOCALAPPDATA"),
            os.environ.get("PROGRAMFILES"),
            os.environ.get("PROGRAMFILES(X86)"),
        ]
        relativos = (
            os.path.join("Google", "Chrome", "Application", "chrome.exe"),
            os.path.join("Microsoft", "Edge", "Application", "msedge.exe"),
        )
        for base in filter(None, bases):
            for relativo in relativos:
                caminho = os.path.join(base, relativo)
                if os.path.isfile(caminho):
                    return caminho
    for caminho in ("/opt/pw-browsers/chromium",
                    "/usr/lib/chromium/chromium",
                    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if os.path.isfile(caminho):
            return caminho
    return None


def gerar(html_path, pdf_path=None, timeout=180):
    """HTML -> PDF ao lado. Devolve o caminho do PDF, ou None se não deu para gerar.

    Nunca levanta exceção: o PDF é conveniência, e um Chrome ausente não pode derrubar a
    geração do material em si — o HTML já foi escrito quando isto roda."""
    if os.environ.get("SEM_PDF"):
        return None
    chrome = chrome_bin()
    if not chrome:
        return None
    html_path = os.path.abspath(html_path)
    pdf_path = pdf_path or os.path.splitext(html_path)[0] + ".pdf"
    # Never return an old PDF when the new rendering fails. Use a temporary
    # file beside the target; preserve browser sandbox by default.
    pdf_path = os.path.abspath(pdf_path)
    try:
        with tempfile.TemporaryDirectory(dir=os.path.dirname(pdf_path)) as tmp:
            candidate = os.path.join(tmp, "render.pdf")
            proc = subprocess.run(
                [chrome, "--headless", "--disable-gpu",
                 "--virtual-time-budget=20000", "--no-pdf-header-footer",
                 "--print-to-pdf=" + candidate, Path(html_path).as_uri()],
                capture_output=True, timeout=timeout)
            if proc.returncode or not os.path.isfile(candidate):
                return None
            with open(candidate, "rb") as f:
                if f.read(5) != b"%PDF-":
                    return None
            os.replace(candidate, pdf_path)
    except (OSError, subprocess.SubprocessError):
        return None
    return pdf_path


def paginas(pdf_path):
    """Quantas páginas o PDF tem (para conferir contra o esperado).

    Contava a sequência literal `/Type /Page`, com espaço — que é como o Chrome escreve.
    O **LibreOffice escreve `/Type/Page`, sem espaço**, e por isso um PDF vindo de um
    `.pptx` era contado como zero páginas. Isso não é detalhe: o `imprimir.py` usa esta
    contagem para a paridade da folha branca do pacote da gráfica, então uma
    apresentação convertida entraria no pacote com a paridade errada e desalinharia tudo
    o que vem depois dela.

    Medido em 21/08, quando o conversor de pptx entrou — e a varredura do repo mostrou
    que o problema era MUITO maior que o pptx: **166 dos 608 PDFs do repositório eram
    contados como zero páginas**, entre eles as três CS do 2º trimestre com os gabaritos
    e os envios, todos os fascículos de `_livros_pdf/`, o PDF do mural do Y9 e os
    passaportes. Só o que sai do Chrome escreve `/Type /Page` com espaço; tudo o que veio
    de outro lugar (as provas, os livros) escrevia `/Type/Page`, colado, ou empacotado em
    fluxo comprimido.

    Onde isso doía: o `imprimir.py` usa esta contagem para a paridade da folha branca e
    para o total de páginas do pacote da gráfica. Uma peça de 6 páginas contada como 0
    tem paridade par por acidente, e desalinha o verso de tudo o que vem depois dela.

    As contagens novas foram conferidas contra o `/Count` da árvore de páginas, que é a
    fonte autoritativa do formato.
    """
    try:
        with open(pdf_path, "rb") as f:
            d = f.read()
    except OSError:
        return None
    # A lookahead separa `/Page` de `/Pages` (o nó da árvore, não uma página) e de
    # `/PageLabel`. Ela NÃO pode excluir a barra: o LibreOffice escreve
    # `/Type/Page/Parent`, colado, e excluir `/` zerava a conta de todo PDF vindo dele.
    padrao = rb"/Type\s*/Page(?![s\w])"
    n = len(re.findall(padrao, d))
    if n:
        return n
    # O LibreOffice ainda empacota os objetos de página em `ObjStm` comprimido, e aí a
    # varredura de bytes não vê nada. Inflar os fluxos custa pouco e só acontece quando a
    # conta deu zero, que é o sinal de que o PDF não veio do Chrome.
    for bruto in re.findall(rb"stream\r?\n(.*?)endstream", d, re.S):
        try:
            n += len(re.findall(padrao, zlib.decompress(bruto)))
        except zlib.error:
            continue
    return n


def main():
    ap = argparse.ArgumentParser(description="Gera o PDF ao lado de cada HTML impresso.")
    ap.add_argument("arquivos", nargs="*")
    ap.add_argument("--todos", action="store_true",
                    help="todo material impresso do repo (handout, lista, prova, atividade)")
    ap.add_argument("--faltando", action="store_true",
                    help="só onde o PDF não existe ou está mais velho que o HTML")
    a = ap.parse_args()

    alvos = list(a.arquivos)
    if a.todos or a.faltando:
        for padrao in ("materials/Y*/*/*/*.html", "materials/Y9/Math/*/*.html"):
            alvos += glob.glob(os.path.join(ROOT, padrao))
    alvos = sorted({os.path.abspath(x) for x in alvos})

    feitos = 0
    for html_path in alvos:
        pdf = os.path.splitext(html_path)[0] + ".pdf"
        if a.faltando and os.path.isfile(pdf) and \
                os.path.getmtime(pdf) >= os.path.getmtime(html_path):
            continue
        saida = gerar(html_path)
        rel = os.path.relpath(html_path, ROOT)
        if saida:
            feitos += 1
            print("  %s  ->  %s pág" % (rel, paginas(saida)))
        else:
            print("  FALHOU %s" % rel)
    print("\n  %d PDF(s) gerado(s)" % feitos)
    return 0


if __name__ == "__main__":
    sys.exit(main())
