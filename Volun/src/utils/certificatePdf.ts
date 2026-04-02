import { jsPDF } from 'jspdf';

export interface CertificateVolunteer {
  id: string;
  name: string;
  dni: string;
  organizacion?: string | null;
  totalHours: number;
  totalActivities: number;
}

export interface CertificateActivity {
  id: string;
  title: string;
  startDate: string | null;
  duration: number;
  responsibleName: string;
  organizacion?: string | null;
}

export interface CertificatePayload {
  volunteer: CertificateVolunteer;
  activities: CertificateActivity[];
  totalHours?: number;
}

async function svgUrlToPngDataUrl(svgUrl: string, targetWidthPx: number, targetHeightPx: number): Promise<string | null> {
  if (!svgUrl) return null;

  try {
    const svgText = await fetch(svgUrl).then((r) => r.text());
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('No se pudo cargar el logo'));
        image.src = blobUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(targetWidthPx));
      canvas.height = Math.max(1, Math.floor(targetHeightPx));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // White background to avoid transparent artifacts in PDFs.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.warn('[certificatePdf] svgUrlToPngDataUrl failed', err);
    return null;
  }
}

function safeText(value: unknown): string {
  return String(value ?? '').trim();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-PE');
}

export async function downloadCertificatePdf(
  payload: CertificatePayload,
  options: {
    filename?: string;
    logoSvgUrl?: string;
    activitiesLimit?: number;
  } = {},
): Promise<void> {
  const volunteer = payload?.volunteer;
  if (!volunteer) throw new Error('No se recibieron datos del certificado');

  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;

  // Header
  const logoPng = options.logoSvgUrl ? await svgUrlToPngDataUrl(options.logoSvgUrl, 480, 144) : null;
  const headerTop = 34;
  const logoW = 120;
  const logoH = 36;

  if (logoPng) {
    doc.addImage(logoPng, 'PNG', margin, headerTop, logoW, logoH);
  } else {
    // Fallback mark (no external assets).
    doc.setFillColor(22, 163, 74);
    doc.circle(margin + 18, headerTop + 18, 18, 'F');
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text('CERTIFICADO DE VOLUNTARIADO', pageWidth / 2, headerTop + 24, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Emitido: ${new Date().toLocaleDateString('es-PE')}`, pageWidth - margin, headerTop + 50, { align: 'right' });

  // Body
  let y = headerTop + 92;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);

  const lines = [
    `Nombre completo: ${safeText(volunteer.name) || '-'}`,
    `DNI: ${safeText(volunteer.dni) || '-'}`,
    `Organizacion: ${safeText(volunteer.organizacion) || '-'}`,
  ];

  for (const line of lines) {
    doc.text(line, margin, y);
    y += 18;
  }

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total horas: ${Number(volunteer.totalHours || 0)}h`, margin, y);
  doc.text(`Total actividades: ${Number(volunteer.totalActivities || 0)}`, pageWidth - margin, y, { align: 'right' });
  y += 22;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Resumen de actividades (validadas)', margin, y);
  y += 14;

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const maxActivities = Math.max(1, Math.min(50, Number(options.activitiesLimit || 12)));
  const activities = (payload.activities || []).slice(0, maxActivities);

  if (activities.length === 0) {
    doc.text('Sin actividades validadas registradas.', margin, y + 10);
  } else {
    y += 8;
    for (let idx = 0; idx < activities.length; idx++) {
      const act = activities[idx];
      const title = safeText(act.title) || 'Sin titulo';
      const meta = `${formatDate(act.startDate)}  |  ${Number(act.duration || 0)}h  |  Responsable: ${safeText(act.responsibleName) || '-'}`;
      const orgLine = safeText(act.organizacion) ? `Organizacion: ${safeText(act.organizacion)}` : '';

      const titleLines = doc.splitTextToSize(`${idx + 1}. ${title}`, pageWidth - margin * 2) as string[];
      const metaLines = doc.splitTextToSize(meta, pageWidth - margin * 2) as string[];
      const orgLines = orgLine ? (doc.splitTextToSize(orgLine, pageWidth - margin * 2) as string[]) : [];

      const blockHeight = (titleLines.length + metaLines.length + orgLines.length) * 14 + 10;
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 14;

      doc.setTextColor(71, 85, 105);
      doc.text(metaLines, margin, y);
      y += metaLines.length * 14;

      if (orgLines.length > 0) {
        doc.text(orgLines, margin, y);
        y += orgLines.length * 14;
      }

      y += 10;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    }
  }

  const safeName = safeText(volunteer.name).replace(/\s+/g, '_') || 'voluntario';
  const filename = options.filename || `certificado_${safeName}.pdf`;
  doc.save(filename);
}

