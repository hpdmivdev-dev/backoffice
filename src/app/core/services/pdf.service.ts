import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Trip } from '../models/trip.model';
import { Guide } from '../models/guide.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  async generateTripPdf(trip: Trip, guides: Guide[]): Promise<void> {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Load Logo
    try {
      const logoBase64 = await this.getBase64Image('/logo.png');
      doc.addImage(logoBase64, 'PNG', margin, currentY, 40, 40);
      currentY += 45;
    } catch (e) {
      console.error('Could not load logo for PDF', e);
      currentY += 10;
    }

    // Header Left: HPD MIV VARAŽDIN + Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HPD MIV VARAŽDIN', margin, currentY);
    currentY += 7;
    doc.setFontSize(12);
    doc.text(trip.section.toUpperCase(), margin, currentY);

    // Header Right: Vodiči
    const rightAlignX = pageWidth - margin;
    let guideY = 25;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Vodiči:', rightAlignX, guideY, { align: 'right' });
    guideY += 5;
    doc.setFont('helvetica', 'normal');
    guides.forEach(g => {
      doc.text(`${g.first_name} ${g.last_name}`, rightAlignX, guideY, { align: 'right' });
      guideY += 5;
    });

    currentY += 15;

    // Trip Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const title = trip.tripType === 'single-day' 
      ? `Program izleta: ${trip.tripName} (${this.formatDate(trip.tripDate!)})`
      : `Program izleta: ${trip.tripName} (${this.formatDate(trip.startDate!)} - ${this.formatDate(trip.endDate!)})`;
    
    // Center title
    const titleLines = doc.splitTextToSize(title, pageWidth - (margin * 2));
    doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += (titleLines.length * 8) + 5;

    // Content Section Helper
    const addSection = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${label}: `, margin, currentY);
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.setFont('helvetica', 'normal');
      const textValue = doc.splitTextToSize(value || '-', pageWidth - margin * 2 - labelWidth);
      doc.text(textValue, margin + labelWidth, currentY);
      currentY += (textValue.length * 6) + 2;
    };

    addSection('Cijena', `Članovi: ${trip.memberPrice}€, Ostali: ${trip.nonMemberPrice}€`);
    addSection('Zahtjevnost', `Kondicijska: ${trip.fitnessDifficulty}, Tehnička: ${trip.technicalDifficulty}`);
    addSection('Polazak', trip.departure);
    addSection('Prijevoz', trip.transport);
    
    currentY += 5;

    // Description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OPIS IZLETA:', margin, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    if (trip.tripType === 'single-day') {
      const descLines = doc.splitTextToSize(trip.description || '-', pageWidth - margin * 2);
      this.checkPageBreak(doc, descLines.length * 6, margin);
      doc.text(descLines, margin, currentY);
      currentY += (descLines.length * 6) + 10;
    } else {
      trip.dayDescriptions?.forEach((day, index) => {
        doc.setFont('helvetica', 'bold');
        const dayHeader = `${index + 1}. DAN (${this.formatDate(day.date)}):`;
        this.checkPageBreak(doc, 15, margin); // Check space for header + some text
        doc.text(dayHeader, margin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal');
        const dayLines = doc.splitTextToSize(day.description || '-', pageWidth - margin * 2);
        doc.text(dayLines, margin, currentY);
        currentY += (dayLines.length * 6) + 6;
      });
    }

    addSection('Povratak', trip.returnInfo);
    
    if (trip.notes) {
      currentY += 5;
      addSection('Napomena', trip.notes);
    }

    // Save or Preview
    window.open(doc.output('bloburl'), '_blank');
  }

  private checkPageBreak(doc: jsPDF, neededHeight: number, margin: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if ((doc as any).currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      (doc as any).currentY = margin;
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR');
  }

  private getBase64Image(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }
}
