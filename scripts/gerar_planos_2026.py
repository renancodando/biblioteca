from __future__ import annotations

import io
import json
import re
import shutil
import subprocess
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_BR.zip"
PORTAL = "https://dadosabertos.tse.jus.br/dataset/candidatos-2026"
ROOT = Path(__file__).resolve().parents[1]
OUT_PDF = ROOT / "dist" / "documentos" / "planos-governo-2026-presidencia.pdf"
OUT_TEXT = ROOT / "dist" / "dados" / "planos-governo-2026"
OUT_INDEX = OUT_TEXT / "index.json"
TMP = ROOT / ".tmp-planos-2026"

CANDIDATOS = [
    "Augusto Cury",
    "Clariana Barão",
    "Edmilson Costa",
    "Flávio Bolsonaro",
    "Hertz Dias",
    "Luiz Inácio Lula da Silva",
    "Renan Santos",
    "Ronaldo Caiado",
    "Romeu Zema",
    "Rui Costa Pimenta",
    "Samara Martins",
    "Wilson Grassi",
]

MAPA_ARQUIVOS = {
    "2026BR280002551547_01.pdf": ("Augusto Cury", "candidatura-validada"),
    "2026BR280002552484_01.pdf": ("Clariana Barão", "candidatura-validada"),
    "2026BR280002551975_01.pdf": ("Edmilson Costa", "candidatura-validada"),
    "2026BR280002551544_01.pdf": ("Flávio Bolsonaro", "candidatura-validada"),
    "2026BR280002541457_01.pdf": ("Hertz Dias", "candidatura-validada"),
    "2026BR280002542548_01.pdf": ("Luiz Inácio Lula da Silva", "candidatura-validada"),
    "2026BR280002540694_01.pdf": ("Renan Santos", "candidatura-validada"),
    "2026BR280002551932_01.pdf": ("Ronaldo Caiado", "candidatura-validada"),
    "2026BR280002539826_01.pdf": ("Romeu Zema", "candidatura-validada"),
    "2026BR280002552487_01.pdf": ("Rui Costa Pimenta", "candidatura-validada"),
    "2026BR280002538811_01.pdf": ("Samara Martins", "candidatura-validada"),
    "2026BR280002548139_01.pdf": ("Wilson Grassi", "candidatura-validada"),
    "2026BR280002553884_01.pdf": ("Pablo Marçal", "registro-adicional"),
    "2026BR280002554479_01.pdf": ("Leonardo Avalanche", "registro-adicional"),
}


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto or "")
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = texto.lower()
    texto = re.sub(r"[^a-z0-9]+", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


def slug(texto: str) -> str:
    return normalizar(texto).replace(" ", "-") or "documento"


def identificar(nome_arquivo: str) -> tuple[str, str]:
    base = Path(nome_arquivo).name
    if base.lower() == "leiame.pdf":
        return "Leia-me do TSE", "metadado"
    return MAPA_ARQUIVOS.get(base, (Path(base).stem, "registro-nao-mapeado"))


def baixar_zip(destino: Path) -> None:
    cookies = TMP / "cookies.txt"
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
    subprocess.run([
        "curl", "-sS", "-L", "--compressed",
        "-A", user_agent,
        "-c", str(cookies),
        "-o", "/dev/null",
        PORTAL,
    ], check=True)
    tentativas = [
        URL,
        "https://dadosabertos.tse.jus.br/dataset/candidatos-2026/resource/433ac1f4-07dc-44a2-bcbe-c87a2073721a/download/proposta_governo_2026_BR.zip",
        "https://dadosabertos.tse.jus.br/dataset/candidatos-2026/resource/433ac1f4-07dc-44a2-bcbe-c87a2073721a/download/",
    ]
    ultimo_erro = None
    for url in tentativas:
        try:
            subprocess.run([
                "curl", "-sS", "-L", "--fail", "--retry", "3", "--retry-all-errors", "--compressed",
                "-A", user_agent,
                "-e", PORTAL,
                "-b", str(cookies),
                "-H", "Accept: application/zip,application/octet-stream;q=0.9,*/*;q=0.8",
                "-H", "Accept-Language: pt-BR,pt;q=0.9,en;q=0.8",
                "-H", "Sec-Fetch-Dest: document",
                "-H", "Sec-Fetch-Mode: navigate",
                "-H", "Sec-Fetch-Site: same-site",
                "-o", str(destino),
                url,
            ], check=True)
            if destino.exists() and destino.stat().st_size > 1000 and destino.read_bytes()[:2] == b"PK":
                return
        except Exception as exc:
            ultimo_erro = exc
        destino.unlink(missing_ok=True)
    raise RuntimeError(f"Nao foi possivel baixar o pacote do TSE: {ultimo_erro}")


def extrair_texto(reader: PdfReader) -> str:
    partes = []
    for pagina in reader.pages:
        try:
            partes.append(pagina.extract_text() or "")
        except Exception:
            partes.append("")
    return "\n\n".join(partes).strip()


def capa_pdf(candidatos: list[str], gerado_em: str) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    _, altura = A4
    margem = 48
    y = altura - 64
    c.setFont("Helvetica-Bold", 18)
    c.drawString(margem, y, "PLANOS DE GOVERNO - PRESIDENCIA - ELEICOES 2026")
    y -= 28
    c.setFont("Helvetica", 9)
    c.drawString(margem, y, "Fonte primaria: Tribunal Superior Eleitoral - Portal de Dados Abertos")
    y -= 14
    c.drawString(margem, y, f"Pacote oficial: {URL}")
    y -= 14
    c.drawString(margem, y, f"Gerado em: {gerado_em}")
    y -= 28
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margem, y, "Recorte: 12 candidaturas presidenciais da lista consolidada do TSE.")
    y -= 28
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margem, y, "Documentos reunidos")
    y -= 18
    c.setFont("Helvetica", 10)
    for i, nome in enumerate(candidatos, 1):
        c.drawString(margem, y, f"{i}. {nome}")
        y -= 16
    y -= 12
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(margem, max(y, 40), "Os documentos seguintes sao reproducoes dos PDFs oficiais contidos no pacote do TSE.")
    c.save()
    return buf.getvalue()


def main() -> None:
    shutil.rmtree(TMP, ignore_errors=True)
    shutil.rmtree(OUT_TEXT, ignore_errors=True)
    TMP.mkdir(parents=True)
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    OUT_TEXT.mkdir(parents=True, exist_ok=True)

    zip_path = TMP / "proposta_governo_2026_BR.zip"
    baixar_zip(zip_path)

    with zipfile.ZipFile(zip_path) as z:
        nomes = [n for n in z.namelist() if n.lower().endswith(".pdf") and not n.endswith("/")]
        if not nomes:
            raise RuntimeError("O pacote oficial do TSE nao trouxe PDFs.")
        z.extractall(TMP / "extraido")

    itens = []
    for nome_zip in nomes:
        caminho = TMP / "extraido" / nome_zip
        candidato, classificacao = identificar(nome_zip)
        try:
            reader = PdfReader(str(caminho), strict=False)
            if reader.is_encrypted:
                try:
                    reader.decrypt("")
                except Exception:
                    pass
            texto = extrair_texto(reader)
            itens.append({
                "candidato": candidato,
                "classificacao": classificacao,
                "arquivo": str(caminho),
                "arquivo_origem": nome_zip,
                "paginas": len(reader.pages),
                "texto": texto,
            })
        except Exception as exc:
            itens.append({
                "candidato": candidato,
                "classificacao": classificacao,
                "arquivo": str(caminho),
                "arquivo_origem": nome_zip,
                "paginas": 0,
                "texto": "",
                "erro": str(exc),
            })

    ordem = {normalizar(nome): i for i, nome in enumerate(CANDIDATOS)}
    itens.sort(key=lambda x: (0 if x["classificacao"] == "candidatura-validada" else 1, ordem.get(normalizar(x["candidato"]), 999), normalizar(x["candidato"])))

    registros = []
    extras = []
    usados = set()
    for item in itens:
        if item["classificacao"] == "metadado":
            continue
        base = slug(item["candidato"])
        nome_txt = base + ".txt"
        contador = 2
        while nome_txt in usados:
            nome_txt = f"{base}-{contador}.txt"
            contador += 1
        usados.add(nome_txt)
        (OUT_TEXT / nome_txt).write_text(item["texto"], encoding="utf-8")
        reg = {
            "candidato": item["candidato"],
            "classificacao": item["classificacao"],
            "arquivo_origem": item["arquivo_origem"],
            "paginas": item["paginas"],
            "texto": f"/dados/planos-governo-2026/{nome_txt}",
            "erro": item.get("erro"),
        }
        if item["classificacao"] == "candidatura-validada":
            registros.append(reg)
        else:
            extras.append(reg)

    faltantes = sorted(set(CANDIDATOS) - {x["candidato"] for x in registros})
    if faltantes:
        raise RuntimeError("Planos faltantes no pacote: " + ", ".join(faltantes))

    gerado_em = datetime.now(timezone.utc).isoformat()
    writer = PdfWriter()
    capa = PdfReader(io.BytesIO(capa_pdf([x["candidato"] for x in registros], gerado_em)))
    for pagina in capa.pages:
        writer.add_page(pagina)

    validos_por_nome = {x["candidato"]: x for x in itens if x["classificacao"] == "candidatura-validada"}
    for nome in CANDIDATOS:
        item = validos_por_nome[nome]
        reader = PdfReader(item["arquivo"], strict=False)
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception:
                continue
        for pagina in reader.pages:
            writer.add_page(pagina)

    with OUT_PDF.open("wb") as f:
        writer.write(f)

    OUT_INDEX.write_text(json.dumps({
        "geradoEm": gerado_em,
        "fonte": "Tribunal Superior Eleitoral - Portal de Dados Abertos",
        "pacoteOficial": URL,
        "pdfUnico": "/documentos/planos-governo-2026-presidencia.pdf",
        "quantidadeCandidaturas": len(registros),
        "documentos": registros,
        "registrosAdicionais": extras,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    shutil.rmtree(TMP, ignore_errors=True)
    print(f"PDF unico: {OUT_PDF}")
    print(f"Candidaturas no PDF: {len(registros)}")
    print(f"Registros adicionais fora do PDF: {len(extras)}")


if __name__ == "__main__":
    main()
