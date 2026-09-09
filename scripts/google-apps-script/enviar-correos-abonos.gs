/**
 * Apps Script para el sheet "compras tu boleta".
 * Envía a cada abonado el link para elegir su silla en la web,
 * usando el endpoint POST /api/abonos/create del sitio.
 *
 * INSTALACIÓN (una sola vez)
 * 1. En el sheet: Extensiones → Apps Script.
 * 2. Borra el contenido de Code.gs y pega este archivo completo.
 * 3. Extensiones → Apps Script → ⚙️ Configuración del proyecto → "Propiedades de secuencia de comandos"
 *    → agrega:
 *      API_URL             = https://zipaquira-fc-eta.vercel.app/api/abonos/create
 *      REGISTRATIONS_URL   = https://zipaquira-fc-eta.vercel.app/api/abonos/registrations
 *      ADMIN_SECRET        = (el mismo valor que pongas en ABONOS_ADMIN_SECRET en Vercel)
 * 4. Guarda. Recarga el sheet (F5 en el navegador). Aparece el menú "Tu Boleta".
 * 5. Autoriza el script la primera vez que lo ejecutes (pide permiso de Gmail y de red).
 *
 * COLUMNAS ESPERADAS (fila 1 = encabezado)
 * A Nombre Completo | B Correo | C Cedula | D Celular
 * E Tipo de compra (abono-boleta) | F Cantidad | G Estado
 * H Talla | I Silla | J Zona | K Contactado | L Link (se llena solo)
 *
 * Antes de ejecutar: llena la columna "Zona" (verde / blanca / roja) de cada
 * fila con tipo de compra "abono" — el mapa de sillas depende de la zona
 * comprada y el endpoint la rechaza si no es una de esas tres.
 */

const COL = {
  NOMBRE: 1,
  CORREO: 2,
  CEDULA: 3,
  CELULAR: 4,
  TIPO: 5,
  CANTIDAD: 6,
  ESTADO: 7,
  TALLA: 8,
  SILLA: 9,
  ZONA: 10,
  CONTACTADO: 11,
  LINK: 12,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tu Boleta")
    .addItem("Enviar correos de silletería", "enviarCorreosSilleteria")
    .addItem("Actualizar sillas y tallas", "actualizarSillasYTallas")
    .addToUi();
}

function enviarCorreosSilleteria() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty("API_URL");
  const adminSecret = props.getProperty("ADMIN_SECRET");

  if (!apiUrl || !adminSecret) {
    SpreadsheetApp.getUi().alert(
      "Falta configurar API_URL y ADMIN_SECRET en Propiedades de secuencia de comandos."
    );
    return;
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  let enviados = 0;
  let saltados = 0;
  let errores = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    const nombre = String(row[COL.NOMBRE - 1] || "").trim();
    const correo = String(row[COL.CORREO - 1] || "").trim();
    const tipo = String(row[COL.TIPO - 1] || "").trim().toLowerCase();
    const cantidadRaw = row[COL.CANTIDAD - 1];
    const zonaRaw = String(row[COL.ZONA - 1] || "").trim().toLowerCase();
    const contactado = String(row[COL.CONTACTADO - 1] || "").trim();

    if (tipo !== "abono") continue;
    if (contactado) {
      saltados++;
      continue;
    }

    if (!correo) {
      sheet.getRange(rowNumber, COL.ESTADO).setValue("Falta correo");
      errores++;
      continue;
    }

    if (!["verde", "blanca", "roja"].includes(zonaRaw)) {
      sheet.getRange(rowNumber, COL.ESTADO).setValue("Falta zona (verde/blanca/roja)");
      errores++;
      continue;
    }

    const abonoCount = Number(cantidadRaw) > 0 ? Math.round(Number(cantidadRaw)) : 1;

    try {
      const response = UrlFetchApp.fetch(apiUrl, {
        method: "post",
        contentType: "application/json",
        headers: { "x-admin-secret": adminSecret },
        payload: JSON.stringify({
          email: correo,
          abonoCount: abonoCount,
          zoneId: zonaRaw,
        }),
        muteHttpExceptions: true,
      });

      const status = response.getResponseCode();
      const body = JSON.parse(response.getContentText());

      if (status !== 200 || !body.ok) {
        sheet.getRange(rowNumber, COL.ESTADO).setValue("Error API: " + (body.error || status));
        errores++;
        continue;
      }

      const link = body.link;
      enviarCorreo(correo, nombre, abonoCount, link);

      sheet.getRange(rowNumber, COL.CONTACTADO).setValue("Sí " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"));
      sheet.getRange(rowNumber, COL.LINK).setValue(link);
      sheet.getRange(rowNumber, COL.ESTADO).setValue("Enlace enviado");
      enviados++;
    } catch (err) {
      sheet.getRange(rowNumber, COL.ESTADO).setValue("Error: " + err.message);
      errores++;
    }
  }

  SpreadsheetApp.getUi().alert(
    `Enviados: ${enviados}\nSaltados (ya contactados): ${saltados}\nErrores: ${errores}`
  );
}

/**
 * Trae de Supabase las compras ya completadas (silla + talla elegidas en la web)
 * y llena Silla / Talla / Estado de cada fila que coincida por correo.
 */
function actualizarSillasYTallas() {
  const props = PropertiesService.getScriptProperties();
  const registrationsUrl = props.getProperty("REGISTRATIONS_URL");
  const adminSecret = props.getProperty("ADMIN_SECRET");

  if (!registrationsUrl || !adminSecret) {
    SpreadsheetApp.getUi().alert(
      "Falta configurar REGISTRATIONS_URL y ADMIN_SECRET en Propiedades de secuencia de comandos."
    );
    return;
  }

  let purchases;
  try {
    const response = UrlFetchApp.fetch(registrationsUrl, {
      method: "get",
      headers: { "x-admin-secret": adminSecret },
      muteHttpExceptions: true,
    });

    const body = JSON.parse(response.getContentText());
    if (response.getResponseCode() !== 200 || !body.ok) {
      SpreadsheetApp.getUi().alert("Error API: " + (body.error || response.getResponseCode()));
      return;
    }
    purchases = body.purchases;
  } catch (err) {
    SpreadsheetApp.getUi().alert("Error consultando confirmaciones: " + err.message);
    return;
  }

  const porCorreo = {};
  purchases.forEach(function (p) {
    porCorreo[String(p.email).trim().toLowerCase()] = p;
  });

  const sheet = SpreadsheetApp.getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  let actualizados = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const correo = String(row[COL.CORREO - 1] || "").trim().toLowerCase();
    if (!correo) continue;

    const purchase = porCorreo[correo];
    if (!purchase || !purchase.seats || purchase.seats.length === 0) continue;

    const sillas = purchase.seats.map(function (s) { return s.seatId; }).join(", ");
    const tallas = purchase.seats.map(function (s) { return s.jerseySize; }).join(", ");

    sheet.getRange(rowNumber, COL.SILLA).setValue(sillas);
    sheet.getRange(rowNumber, COL.TALLA).setValue(tallas);
    sheet.getRange(rowNumber, COL.ESTADO).setValue("Silla confirmada");
    actualizados++;
  }

  SpreadsheetApp.getUi().alert(`Filas actualizadas con silla y talla: ${actualizados}`);
}

function enviarCorreo(correo, nombre, abonoCount, link) {
  const saludo = nombre ? nombre.split(" ")[0] : "Hincha";
  const plural = abonoCount > 1 ? `tus ${abonoCount} abonos` : "tu abono";

  const asunto = "Elige tu silla — Real Zipaquirá FC";
  const cuerpo =
    `Hola ${saludo},\n\n` +
    `Gracias por tu compra de ${plural} en Tu Boleta. Ya puedes elegir tu silla numerada ` +
    `en la tribuna occidental del estadio.\n\n` +
    `Entra aquí y sigue los pasos:\n${link}\n\n` +
    `Este enlace es personal, no lo compartas.\n\n` +
    `Nos vemos en la cancha,\nReal Zipaquirá FC`;

  GmailApp.sendEmail(correo, asunto, cuerpo);
}
