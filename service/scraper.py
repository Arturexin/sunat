import os
import re
from playwright.async_api import async_playwright
import pandas as pd
import datetime

DOWNLOAD_RUC = os.path.abspath("descargas_ruc")
DOWNLOAD_CPE = os.path.abspath("descargas_cpe")
ruc_procesados = []

for folder in [DOWNLOAD_RUC, DOWNLOAD_CPE]:
    os.makedirs(folder, exist_ok=True)

async def procesar_ruc(page, ruc):
    url = "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias?accion=consPorRuc&nroRuc=xruc"
    await page.goto(url)
    await page.click("#btnPorRuc")
    await page.fill("#txtRuc", str(ruc))
    await page.click("#btnAceptar")
    await page.wait_for_selector("h4.list-group-item-heading")
    
    h4s = await page.query_selector_all("h4.list-group-item-heading")
    titulo = ""
    for h4 in h4s:
        text = await h4.inner_text()
        if "-" in text:
            titulo = text
            print(f"RUC y Razón Social para {text}")
            break

    ps = await page.query_selector_all("p.list-group-item-text")
    estados = [await p.inner_text() for p in ps if "ACTIVO" in (await p.inner_text()).upper()]
    condiciones = [await p.inner_text() for p in ps if "HABIDO" in (await p.inner_text()).upper()]

    ruc_dict = {
        "RUC": ruc,
        "ESTADO DEL CONTRIBUYENTE": ", ".join(estados),
        "CONDICION DEL CONTRIBUYENTE": ", ".join(condiciones)
    }
    ruc_procesados.append(ruc_dict)

    safe_titulo = re.sub(r"[\\/*?:\"<>|]", "_", titulo) + ".pdf"
    pdf_path = os.path.join(DOWNLOAD_RUC, safe_titulo)
    await page.evaluate("document.body.style.zoom='100%'")
    await page.pdf(path=pdf_path, format="A4", scale=0.7, print_background=True)
    print(f"PDF RUC guardado como: {safe_titulo}")

async def procesar_cpe(page, ruc):
    # Formatear la fecha a dd-mm-aaaa
    fecha_original = str(ruc["FECHA"])
    try:
        # Si la fecha viene como '1970-01-01 00:00:45' o similar
        fecha_dt = datetime.datetime.strptime(fecha_original[:10], "%Y-%m-%d")
        fecha_formateada = fecha_dt.strftime("%d-%m-%Y")  # dd-mm-aaaa
    except Exception:
        fecha_formateada = fecha_original  # Si falla, usa la original

    tipo = "03" if ruc["TIPO"] == "F" else "06"
    url = "https://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm"
    await page.goto(url)
    await page.fill('input[name="num_ruc"]', str(ruc["RUC"]))
    await page.select_option('select[name="tipocomprobante"]', value=tipo)
    await page.fill('input[name="num_serie"]', str(ruc["SERIE"]))
    await page.fill('input[name="num_comprob"]', str(ruc["Nº SERIE"]))
    await page.fill('input[name="fec_emision"]', fecha_formateada)

    # 🔧 Blindaje por el calendario que interfiere
    await page.evaluate("document.querySelector('input[name=\"fec_emision\"]').blur()")
    await page.fill('input[name="fec_emision"]', fecha_formateada)  # Reconfirmar
    await page.click("body")  # Forzar cierre del calendario
    await page.wait_for_timeout(500)  # Breve pausa para que cierre

    await page.fill('input[name="cantidad"]', str(ruc["IMPORTE TOTAL EN SOLES"]))
    await page.locator('input[name="wacepta"]').scroll_into_view_if_needed()
    await page.click('input[name="wacepta"]')

    td_result = await page.query_selector('td.bgn')
    if td_result:
        safe_titulo = f"{ruc['SERIE']}-{ruc['Nº SERIE']}.pdf"
        pdf_path = os.path.join(DOWNLOAD_CPE, safe_titulo)
        await page.pdf(path=pdf_path, format="A4", scale=0.7, print_background=True)
        print(f"PDF guardado como: {safe_titulo}")
        texto = await td_result.inner_text()
        print("Resultado encontrado:", texto)
        return texto
    else:
        print("❌ No se encontró el resultado de la consulta.")
        return "No se encontró el resultado de la consulta."

async def ejecutar_scraping(data):
    print("🔍 Iniciando scraping...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # context = await browser.new_context()
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

        for ruc in data['ruc']:
            print(f"🔄 Procesando RUC para {ruc}")
            page = await context.new_page()
            try:
                await procesar_ruc(page, ruc)
            except Exception as e:
                print(f"❌ Error procesando RUC {ruc}: {e}")
            await page.close()

        for ruc in data['comprobante']:
            print(f"🔄 Procesando CPE para {ruc}")
            page = await context.new_page()
            try:
                ruc["OBSERVACION CONSULTA CPE"] = await procesar_cpe(page, ruc)
            except Exception as e:
                error_msg = f"Error Playwright: {str(e)}"
                print(f"❌ Error procesando CPE {ruc['SERIE']}-{ruc['Nº SERIE']}: {error_msg}")
                ruc["OBSERVACION CONSULTA CPE"] = 'Excedió el tiempo de espera.'  # <-- Guarda el error en el comprobante
            await page.close()

        await browser.close()

    # 🔁 Unir datos de RUC con comprobantes
    procesados_map = {item["RUC"]: item for item in ruc_procesados}
    for item in data.get("comprobante", []):
        ruc = item.get("RUC")
        if ruc in procesados_map:
            item.update({
                "ESTADO DEL CONTRIBUYENTE": procesados_map[ruc].get("ESTADO DEL CONTRIBUYENTE", ""),
                "CONDICION DEL CONTRIBUYENTE": procesados_map[ruc].get("CONDICION DEL CONTRIBUYENTE", "")
            })
    
    # Guardar los resultados en un nuevo archivo Excel
    df_resultado = pd.DataFrame(data['comprobante'])
    df_resultado.to_excel("resultado_consulta.xlsx", index=False)

    return {
        "status": "success",
        "message": "Scraping completado",
        "data": data
    }