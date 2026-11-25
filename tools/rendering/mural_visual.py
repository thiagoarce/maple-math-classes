"""Small, opt-in mural repertoire adapted from Escalada's Impulso.
Trusted authored HTML only in the content parameter; labels are escaped.
Assets are fixed local SVGs, not arbitrary paths.
"""
from pathlib import Path
from html import escape
from . import identidade as idt
HERE=Path(__file__).resolve().parent
ASSETS=HERE/"mural_assets"
def css(tema):
    f=idt.FRENTES[tema]
    return (":root{--mv-primary:"+f["forte"]+";--mv-alert:#ffe159;--mv-ink:#232323}\n"
            +(HERE/"mural_impulso.css").read_text(encoding="utf-8"))
def _icon(name):
    if name not in ("chave","conexao","seta"):raise ValueError("unknown icon")
    return (ASSETS/(name+".svg")).read_text(encoding="utf-8").strip()
def chave(label):
    return '<div class="mural-key">'+_icon("chave")+'<span>'+escape(label)+'</span></div>'
def atencao(label):
    return '<span class="mural-attention">'+escape(label)+'</span>'
def macete(label, trusted_html):
    return '<div class="mural-macete"><span class="mural-macete-title">'+escape(label)+'</span>'+trusted_html+'</div>'
def secao(label):
    return '<div class="mural-section-heading">'+escape(label)+'</div>'
def conexao(kind="conexao"):
    if kind not in ("conexao","seta"):raise ValueError("unknown connector")
    return '<span class="mural-connector" aria-hidden="true">'+_icon(kind)+'</span>'
