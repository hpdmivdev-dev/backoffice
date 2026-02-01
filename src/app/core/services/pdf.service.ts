import { Injectable } from '@angular/core';
import { Trip } from '../models/trip.model';
import { Guide } from '../models/guide.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  async generateTripPdf(trip: Trip, guides: Guide[]): Promise<void> {
    // Dynamically load heavy libraries to reduce initial bundle size
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const jsPDF = jsPDFModule.default;
    const html2canvas = html2canvasModule.default;

    // Create a hidden container for the PDF content to ensure 100% correct font rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#333333';
    container.style.fontFamily = "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    container.style.boxSizing = 'border-box';

    // Build the HTML structure
    container.innerHTML = `
      <style>
        .pdf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo-box { width: 120px; }
        .logo-box img { width: 100%; }
        .section-name { font-size: 18pt; font-weight: bold; text-transform: uppercase; text-align: right; color: #495c98; }
        
        .trip-title { font-size: 22pt; font-weight: bold; text-align: center; margin: 40px 0; line-height: 1.3; }
        
        .info-row { margin-bottom: 12px; font-size: 12pt; line-height: 1.5; }
        .info-label { font-weight: bold; text-transform: uppercase; margin-right: 5px; }
        
        .price-section { margin: 20px 0; }
        .price-item { margin-left: 20px; margin-top: 5px; font-style: italic; }
        
        .content-section { margin-top: 30px; }
        .section-header { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
        .description-text { font-size: 11pt; line-height: 1.6; white-space: pre-wrap; }
        
        .day-prog { margin-bottom: 20px; }
        .day-title { font-weight: bold; color: #495c98; margin-bottom: 8px; }
        .day-desc { margin-left: 10px; padding-left: 10px; border-left: 2px solid #eef0f5; }

        .note-red { color: #dc2626; font-weight: bold; margin-top: 25px; font-size: 12pt; }
        
        .contact-box { margin-top: 50px; padding-top: 20px; border-top: 2px solid #444; }
        .contact-title { font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 15px; }
        .contact-item { display: grid; grid-template-columns: 200px 1fr 150px; margin-bottom: 8px; font-size: 11pt; }
        .contact-email { color: #2563eb; }
      </style>

      <div class="pdf-header">
        <div class="logo-box">
          <img src="/logo.png" />
          <div style="font-weight: bold; font-size: 10pt; margin-top: 5px;">HPD MIV VARAŽDIN</div>
        </div>
        <div class="section-name">${trip.section}</div>
      </div>

      <div class="trip-title">
        Program izleta u ${trip.tripName}
        <br>
        <span style="font-size: 16pt;">${this.getTripDateRange(trip)}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Kondicijska zahtjevnost:</span>
        <span>${this.getFitnessLabel(trip.fitnessDifficulty)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Tehnička zahtjevnost:</span>
        <span>${this.getTechnicalLabel(trip.technicalDifficulty)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Polazak:</span>
        <span>${trip.departure}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Prijevoz:</span>
        <span>${trip.transport}</span>
      </div>

      <div class="content-section">
        <div class="section-header">Cijena</div>
        <div class="price-item">- Članovi HPD „MIV“ Varaždin: <b>${trip.memberPrice}€</b></div>
        <div class="price-item">- Planinari, članovi drugih društava: <b>${trip.nonMemberPrice}€</b></div>
      </div>

      <div class="content-section">
        <div class="section-header">Opis planinarske staze</div>
        <div class="description-text">
          ${this.renderTripDescription(trip)}
        </div>
      </div>

      <div class="info-row" style="margin-top: 30px;">
        <span class="info-label">Povratak:</span>
        <span>${trip.returnInfo}</span>
      </div>

      ${trip.notes ? `<div class="note-red">NAPOMENA: <span style="font-weight: normal; color: #333;">${trip.notes}</span></div>` : ''}

      <div class="contact-box">
        <div class="contact-title">Kontakt osobe:</div>
        ${guides.map(g => `
          <div class="contact-item">
            <span style="font-weight: bold;">${g.first_name} ${g.last_name}</span>
            <span class="contact-email">${g.email}</span>
            <span style="text-align: right;">${g.phone || '-'}</span>
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794 // Approx A4 width in pixels at 96dpi
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const margin = 15; // 15mm margins for a premium look
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const innerWidth = pageWidth - (2 * margin);
      const innerHeight = pageHeight - (2 * margin);
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeightInPdf = (imgProps.height * innerWidth) / imgProps.width;

      let heightLeft = imgHeightInPdf;
      let position = 0;

      // Helper to "clean" the margins on each page to avoid cut-off content showing in padding areas
      const maskMargins = () => {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, margin, 'F'); // Top margin
        pdf.rect(0, pageHeight - margin, pageWidth, margin, 'F'); // Bottom margin
        pdf.rect(0, 0, margin, pageHeight, 'F'); // Left margin
        pdf.rect(pageWidth - margin, 0, margin, pageHeight, 'F'); // Right margin
      };

      // Add the first page
      pdf.addImage(imgData, 'JPEG', margin, margin, innerWidth, imgHeightInPdf);
      maskMargins();
      heightLeft -= innerHeight;

      // Add subsequent pages if the content overflows
      while (heightLeft > 0) {
        position -= innerHeight; // Shift the image up
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position + margin, innerWidth, imgHeightInPdf);
        maskMargins();
        heightLeft -= innerHeight;
      }

      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
  }

  private getTripDateRange(trip: Trip): string {
    if (trip.tripType === 'single-day') {
      return this.formatDate(trip.tripDate!);
    }
    return `${this.formatDate(trip.startDate!)} - ${this.formatDate(trip.endDate!)}`;
  }

  private renderTripDescription(trip: Trip): string {
    if (trip.tripType === 'single-day') {
      return trip.description || '-';
    }
    
    return (trip.dayDescriptions || []).map((day, i) => `
      <div class="day-prog">
        <div class="day-title">${i + 1}. DAN (${this.formatWebDay(day.date)}):</div>
        <div class="day-desc">${day.description || '-'}</div>
      </div>
    `).join('');
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR');
  }

  private formatWebDay(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private getFitnessLabel(val: string): string {
    const map: any = { 'K1': 'Lagano (do 5h hoda)', 'K2': 'Umjereno teško (5-7h hoda)', 'K3': 'Teško (7-9h hoda)', 'K4': 'Vrlo teško (preko 9h hoda)' };
    return map[val] || val;
  }

  private getTechnicalLabel(val: string): string {
    const map: any = { 'T1': 'Nezahtjevno (bez upotrebe ruku)', 'T2': 'Umjereno zahtjevno (povremena upotreba ruku)', 'T3': 'Zahtjevno (uz upotrebu pomagala)', 'T4': 'Vrlo zahtjevno (ozbiljno penjanje)' };
    return map[val] || val;
  }
}
