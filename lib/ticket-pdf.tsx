import path from "path";
import QRCode from "qrcode";
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { STADIUM_ZONES, formatSeatId, type StadiumZoneId } from "@/lib/stadium-seating";

const RZ_FOREST = "#0B2810";
const RZ_FOREST_DARK = "#061A0A";
const RZ_BURGUNDY = "#740704";
const RZ_GOLD = "#A99259";
const RZ_CREAM = "#F4EFE5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: RZ_FOREST_DARK,
    padding: 0,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    backgroundColor: RZ_BURGUNDY,
  },
  headerHalf: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  headerHalfRight: {
    backgroundColor: RZ_FOREST,
  },
  headerLabel: {
    color: RZ_CREAM,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
  },
  body: {
    padding: 28,
  },
  competition: {
    color: RZ_GOLD,
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 1,
  },
  crestsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 14,
    gap: 24,
  },
  crest: {
    width: 70,
    height: 70,
    objectFit: "contain",
  },
  vs: {
    color: RZ_GOLD,
    fontSize: 28,
    fontWeight: 700,
  },
  matchup: {
    color: RZ_CREAM,
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 2,
  },
  venue: {
    color: RZ_CREAM,
    fontSize: 10,
    textAlign: "center",
    opacity: 0.85,
    marginBottom: 2,
  },
  dateTime: {
    color: RZ_GOLD,
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RZ_GOLD,
    opacity: 0.4,
    marginVertical: 14,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailsCol: {
    flexDirection: "column",
    gap: 10,
  },
  fieldLabel: {
    color: RZ_GOLD,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  fieldValue: {
    color: RZ_CREAM,
    fontSize: 13,
    fontWeight: 700,
  },
  qrBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 110,
    height: 110,
  },
  qrCode: {
    color: RZ_CREAM,
    fontSize: 8,
    marginTop: 6,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
    color: RZ_CREAM,
    fontSize: 8,
    opacity: 0.6,
  },
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
  return QRCode.toDataURL(code, { margin: 1, width: 300, color: { dark: "#061A0A", light: "#F4EFE5" } });
}

function TicketPage({ data, qrSrc, crestSrc }: { data: TicketData; qrSrc: string; crestSrc: string }) {
  const zone = data.zoneId ? STADIUM_ZONES[data.zoneId] : null;
  return (
    <Page size={[420, 620]} style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerHalf}>
          <Text style={styles.headerLabel}>ZIPAQUIRÁ FÚTBOL CLUB</Text>
        </View>
        <View style={[styles.headerHalf, styles.headerHalfRight]}>
          <Text style={[styles.headerLabel, { textAlign: "right" }]}>{data.opponent.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.competition}>{data.competition.toUpperCase()}</Text>

        <View style={styles.crestsRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
          <Image src={crestSrc} style={styles.crest} />
          <Text style={styles.vs}>VS</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not a DOM <img> */}
          <Image src={crestSrc} style={styles.crest} />
        </View>

        <Text style={styles.matchup}>Zipaquirá F.C. vs {data.opponent}</Text>
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

        <Text style={styles.footer}>
          Presenta este código QR en la entrada del estadio. Boleta válida para una sola persona, un solo ingreso.
        </Text>
      </View>
    </Page>
  );
}

export async function renderTicketsPdfBuffer(tickets: TicketData[]): Promise<Buffer> {
  const crestSrc = path.join(process.cwd(), "public", "images", "escudo-zipa-fc.jpg");
  const pages = await Promise.all(
    tickets.map(async (data) => ({ data, qrSrc: await qrDataUrl(data.ticketCode) }))
  );

  const doc = (
    <Document>
      {pages.map(({ data, qrSrc }) => (
        <TicketPage key={data.ticketCode} data={data} qrSrc={qrSrc} crestSrc={crestSrc} />
      ))}
    </Document>
  );

  return renderToBuffer(doc);
}

export type { TicketData };
