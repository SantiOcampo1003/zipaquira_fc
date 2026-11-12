import QRCode from "qrcode";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { STADIUM_ZONES, formatSeatId, type StadiumZoneId } from "@/lib/stadium-seating";

const RZ_FOREST = "#0B2810";
const RZ_FOREST_DARK = "#0F3320";
const RZ_BURGUNDY = "#7D1613";
const RZ_GOLD = "#C0A06A";
const RZ_CREAM = "#F4EFE5";
const RZ_SAND = "#E9DFCB";

const styles = StyleSheet.create({
  page: { backgroundColor: RZ_FOREST_DARK, padding: 0, fontFamily: "Helvetica" },
  header: { flexDirection: "row", height: 34 },
  headerLeft: { width: "50%", backgroundColor: RZ_BURGUNDY, justifyContent: "center", paddingHorizontal: 18 },
  headerRight: { width: "50%", backgroundColor: RZ_FOREST, justifyContent: "center", paddingHorizontal: 18 },
  headerLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 0.8 },
  top: { backgroundColor: RZ_SAND, height: 120, alignItems: "center", justifyContent: "center", paddingTop: 6 },
  competition: { color: RZ_GOLD, fontSize: 30, fontWeight: 700, letterSpacing: -0.5 },
  matchLabel: { color: RZ_FOREST, fontSize: 12, marginTop: 4, letterSpacing: 2 },
  crestsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 30, marginTop: -44 },
  crestZipa: { width: 90, height: 118, objectFit: "contain" },
  crestRival: { width: 90, height: 118, objectFit: "contain" },
  crestRivalFallback: { width: 90, height: 118 },
  center: { alignItems: "center", justifyContent: "center", marginTop: 30 },
  vs: { color: RZ_GOLD, fontSize: 52, fontWeight: 700 },
  namesRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginTop: 8 },
  nameCol: { width: "42%", alignItems: "center" },
  nameWhite: { color: "#FFFFFF", fontSize: 15, fontWeight: 700, textAlign: "center" },
  nameGold: { color: RZ_GOLD, fontSize: 15, fontWeight: 700, textAlign: "center" },
  venue: { color: RZ_GOLD, fontSize: 11, textAlign: "center", marginTop: 18 },
  dateTime: { color: RZ_CREAM, fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: RZ_GOLD, opacity: 0.4, marginHorizontal: 28, marginVertical: 16 },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 28 },
  detailsCol: { flexDirection: "column", gap: 8 },
  fieldLabel: { color: RZ_GOLD, fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  fieldValue: { color: RZ_CREAM, fontSize: 12, fontWeight: 700 },
  qrBox: { alignItems: "center", justifyContent: "center" },
  qrImage: { width: 104, height: 104 },
  qrCode: { color: RZ_CREAM, fontSize: 8, marginTop: 5, letterSpacing: 1 },
  logos: { width: 170, height: 45, objectFit: "contain", alignSelf: "center", marginTop: 16 },
  footer: { marginTop: 8, textAlign: "center", color: RZ_CREAM, fontSize: 7.5, opacity: 0.6, paddingHorizontal: 28 },
});

type TicketData = {
  opponent: string;
  competition: string;
  venue: string;
  matchDateLabel: string;
  holderFullName: string;
  holderDocumentId: string;
  /** null/undefined = boleta General (sin silla ni zona numerada). */
  zoneId?: StadiumZoneId | null;
  seatNumber?: number | null;
  ticketCode: string;
};

async function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, { margin: 1, width: 300, color: { dark: "#0F3320", light: "#F4EFE5" } });
}

function getSiteUrl(): string {
  return process.env.SITE_URL?.replace(/\/$/, "") || "https://zipaquira-fc-eta.vercel.app";
}

const assetCache = new Map<string, Promise<string | null>>();

/**
 * Se descargan desde la URL pública (no con fs): en las funciones serverless
 * de Vercel la carpeta public/ solo la sirve el CDN. Si falla, devuelve null
 * y la boleta se genera igual sin esa imagen.
 */
function getAssetDataUrl(path: string): Promise<string | null> {
  let p = assetCache.get(path);
  if (!p) {
    p = fetch(`${getSiteUrl()}${path}`)
      .then(async (res) => {
        if (!res.ok) return null;
        const mime = path.endsWith(".png") ? "image/png" : "image/jpeg";
        return `data:${mime};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      })
      .catch(() => null);
    assetCache.set(path, p);
  }
  return p.then((v) => {
    if (v === null) assetCache.delete(path);
    return v;
  });
}

/** Escudos de rivales conocidos (public/images/ticket). Agregar uno por rival nuevo. */
function rivalCrestPath(opponent: string): string | null {
  const o = opponent
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (o.includes("caqueta")) return "/images/ticket/caqueta-cd.png";
  return null;
}

type Assets = {
  zipaCrest: string | null;
  rivalCrest: string | null;
  logos: string | null;
};

async function loadAssets(opponent: string): Promise<Assets> {
  const rivalPath = rivalCrestPath(opponent);
  const [zipaCrest, rivalCrest, logos] = await Promise.all([
    getAssetDataUrl("/images/ticket/escudo-zipa-fc.png"),
    rivalPath ? getAssetDataUrl(rivalPath) : Promise.resolve(null),
    getAssetDataUrl("/images/ticket/alcaldia-imcrdz.png"),
  ]);
  return { zipaCrest, rivalCrest, logos };
}

function splitName(name: string): [string, string] {
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length < 2) return [words[0] ?? "", ""];
  const rest = words.slice(1).join(" ");
  return [words[0], rest === "CD" ? "CLUB DEPORTIVO" : rest];
}

function TicketPage({ data, qrSrc, assets }: { data: TicketData; qrSrc: string; assets: Assets }) {
  const zone = data.zoneId ? STADIUM_ZONES[data.zoneId] : null;
  const [rivalFirst, rivalRest] = splitName(data.opponent);
  return (
    <Page size={[420, 690]} style={styles.page} wrap={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerLabel, { color: "#FFFFFF" }]}>ZIPAQUIRÁ FÚTBOL CLUB</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.headerLabel, { color: RZ_GOLD, textAlign: "right" }]}>HERENCIA MUISCA</Text>
        </View>
      </View>

      <View style={styles.top}>
        <Text style={styles.competition}>{data.competition.toUpperCase()}</Text>
        <Text style={styles.matchLabel}>BOLETA DE INGRESO</Text>
      </View>

      <View style={styles.crestsRow}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
        {assets.zipaCrest ? <Image src={assets.zipaCrest} style={styles.crestZipa} /> : <View style={styles.crestZipa} />}
        <View style={styles.center}>
          <Text style={styles.vs}>VS</Text>
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
        {assets.rivalCrest ? <Image src={assets.rivalCrest} style={styles.crestRival} /> : <View style={styles.crestRivalFallback} />}
      </View>

      <View style={styles.namesRow}>
        <View style={styles.nameCol}>
          <Text style={styles.nameWhite}>ZIPAQUIRÁ</Text>
          <Text style={styles.nameGold}>FÚTBOL CLUB</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.nameWhite}>{rivalFirst}</Text>
          {rivalRest ? <Text style={styles.nameGold}>{rivalRest}</Text> : null}
        </View>
      </View>

      <Text style={styles.venue}>{data.venue}</Text>
      <Text style={styles.dateTime}>{data.matchDateLabel}</Text>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailsCol}>
          <View>
            <Text style={styles.fieldLabel}>TITULAR</Text>
            <Text style={styles.fieldValue}>{data.holderFullName}</Text>
          </View>
          <View>
            <Text style={styles.fieldLabel}>CÉDULA</Text>
            <Text style={styles.fieldValue}>{data.holderDocumentId}</Text>
          </View>
          {zone && data.seatNumber ? (
            <>
              <View>
                <Text style={styles.fieldLabel}>ZONA</Text>
                <Text style={styles.fieldValue}>{zone.shortName}</Text>
              </View>
              <View>
                <Text style={styles.fieldLabel}>SILLA</Text>
                <Text style={styles.fieldValue}>#{formatSeatId(data.seatNumber)}</Text>
              </View>
            </>
          ) : (
            <View>
              <Text style={styles.fieldLabel}>TRIBUNA</Text>
              <Text style={styles.fieldValue}>General</Text>
            </View>
          )}
        </View>

        <View style={styles.qrBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
          <Image src={qrSrc} style={styles.qrImage} />
          <Text style={styles.qrCode}>{data.ticketCode}</Text>
        </View>
      </View>

      {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
      {assets.logos ? <Image src={assets.logos} style={styles.logos} /> : null}
      <Text style={styles.footer}>
        Presenta este código QR en la entrada del estadio. Boleta válida para una sola persona, un solo ingreso.
      </Text>
    </Page>
  );
}

export async function renderTicketsPdfBuffer(tickets: TicketData[]): Promise<Buffer> {
  const pages = await Promise.all(
    tickets.map(async (data) => ({
      data,
      qrSrc: await qrDataUrl(data.ticketCode),
      assets: await loadAssets(data.opponent),
    }))
  );

  const doc = (
    <Document>
      {pages.map(({ data, qrSrc, assets }) => (
        <TicketPage key={data.ticketCode} data={data} qrSrc={qrSrc} assets={assets} />
      ))}
    </Document>
  );

  return renderToBuffer(doc);
}

export type { TicketData };
