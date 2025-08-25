import pdfplumber as pdf
import re
import os
from datetime import datetime

# Carpeta donde están los PDFs
CARPETA_PDFS = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(CARPETA_PDFS, exist_ok=True)

# RUC del cliente (ejemplo fijo, lo puedes recibir del frontend si quieres)
RUC_CLIENTE = "20148092282"

# Regex
REGEX_RUC = r"\b(?:10|20)\d{9}\b"
REGEX_COMPROBANTE = r"\b([A-Z][A-Z0-9]{0,3})-(\d{1,8})\b"
REGEX_FECHA = r"(?:fecha\s*)?emisi[oó]n[:\s-]*([0-9]{2,4}[-/][0-9]{1,2}[-/][0-9]{2,4})(?:[\s-]+([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?))?"
REGEX_IMPORTE = r"(?:importe\s*total|total\s*importe|total\s*pagado|total\s*venta|total)\s*[:\-]?\s*\(?S?\/?\)?\s*(\d+(?:,\d{3})*\.\d{2})"
REGEX_LINEA_PRODUCTO = r"^\s*\d+\s+(.+?)\s+\d+(?:,\d{3})*\.\d{2}"

def extraer_descripciones(texto: str):
    descripciones = []
    lineas = texto.splitlines()
    en_descripcion = False
    buffer = []

    for linea in lineas:
        linea_strip = linea.strip()

        if re.search(r'DESCRIPCION|DESCRIPCIÓN', linea_strip, re.IGNORECASE):
            en_descripcion = True
            continue

        if en_descripcion:
            if re.search(r'TOTAL|IMPORTE|SON:|OBSERVACIONES|EXONERADA|GRAVADA|IGV', linea_strip, re.IGNORECASE):
                break

            if not linea_strip or linea_strip.startswith("-") or linea_strip.startswith("[ CANT"):
                continue

            buffer.append(linea_strip)

            if re.search(r'\d+\.\d{2}', linea_strip):
                descripcion = " ".join(buffer)
                descripciones.append(f"{descripcion}")
                buffer = []

    return descripciones

def normalizar_fecha(fecha_str: str) -> str:
    if not fecha_str:
        return None

    formatos = [
        "%d/%m/%Y", "%d-%m-%Y",
        "%Y/%m/%d", "%Y-%m-%d",
        "%d/%m/%y", "%d-%m-%y",
        "%y/%m/%d", "%y-%m-%d"
    ]

    for fmt in formatos:
        try:
            fecha = datetime.strptime(fecha_str, fmt)
            return fecha.strftime("%d/%m/%Y")
        except ValueError:
            continue

    return fecha_str

def procesar_pdfs():

    resultados = []

    for archivo in os.listdir(CARPETA_PDFS):
        if archivo.lower().endswith(".pdf"):
            ruta_pdf = os.path.join(CARPETA_PDFS, archivo)

            all_text = ""
            with pdf.open(ruta_pdf) as pdf_file:
                for page in pdf_file.pages:
                    text = page.extract_text()
                    if text:
                        all_text += "\n" + text

            # Buscar RUCs
            rucs = re.findall(REGEX_RUC, all_text)
            rucs_unicos = list(set(rucs))

            if RUC_CLIENTE in rucs_unicos:
                posibles_rucs = [r for r in rucs_unicos if r != RUC_CLIENTE]
                ruc_vendedor = posibles_rucs[0] if posibles_rucs else None
            else:
                ruc_vendedor = None

            # Buscar comprobante
            # Elimina espacios alrededor del guion y entre serie y número
            comprobante_text = re.sub(r'\s*-\s*', '-', all_text)
            comprobante_match = re.search(REGEX_COMPROBANTE, comprobante_text)
            comprobante = comprobante_match.group(0) if comprobante_match else None
            comprobante_serie = comprobante_match.group(1) if comprobante_match else None
            comprobante_numero = comprobante_match.group(2) if comprobante_match else None

            # Tipo de comprobante
            tipo_comprobante = None
            if re.search(r"\bboleta\b", all_text, flags=re.IGNORECASE):
                tipo_comprobante = "B"
            elif re.search(r"\bfactura\b", all_text, flags=re.IGNORECASE):
                tipo_comprobante = "F"

            # Fecha emisión
            fecha_match = re.search(REGEX_FECHA, all_text, re.IGNORECASE)
            fecha_emision = normalizar_fecha(fecha_match.group(1)) if fecha_match else None
            print(f"Procesado: {fecha_emision}")

            # Importe
            importe_match = re.search(REGEX_IMPORTE, all_text, flags=re.IGNORECASE)
            importe_total = importe_match.group(1) if importe_match else None
            # Descripciones
            descripciones = extraer_descripciones(all_text)

            # Validación: omitir si faltan datos clave
            if not (comprobante and comprobante_serie and comprobante_numero and ruc_vendedor and fecha_emision and importe_total):
                continue  # Salta este archivo

            resultados.append({
                "archivo": archivo,
                "ruc_cliente": RUC_CLIENTE,
                "RUC": ruc_vendedor,
                "comprobante": comprobante,
                "SERIE": comprobante_serie,
                "Nº SERIE": comprobante_numero,
                "TIPO": tipo_comprobante,
                "FECHA": fecha_emision,
                "IMPORTE TOTAL EN SOLES": importe_total,
                "CONCEPTO": "\n".join(f'"{desc}", ' for desc in descripciones),
                "RAZÓN SOCIAL DE PROVEEDOR": '',
                "CONDICION DEL CONTRIBUYENTE": '',
                "ESTADO DEL CONTRIBUYENTE": '',
                "OBSERVACION CONSULTA CPE": '',
            })
            
    return resultados
