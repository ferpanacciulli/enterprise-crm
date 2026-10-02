package com.enterprise.crm.service;

import com.enterprise.crm.dto.InvoiceItemResponse;
import com.enterprise.crm.dto.InvoiceResponse;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Genera el PDF de una factura en el servidor (no window.print() del navegador).
 * A diferencia del print del cliente, este archivo se puede mandar por mail,
 * archivarse o adjuntarse, y el resultado es siempre el mismo sin importar el
 * navegador del usuario.
 *
 * OJO (contexto Argentina): esto sigue siendo un comprobante interno. Para que
 * sea una factura valida fiscalmente hace falta el CAE de AFIP (ver README,
 * seccion "Decisiones de arquitectura").
 */
@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat MONEY_FMT = NumberFormat.getNumberInstance(new Locale("es", "AR"));

    public byte[] generate(InvoiceResponse invoice) {
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(30, 58, 95));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.GRAY);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            document.add(new Paragraph("Enterprise CRM", titleFont));

            Paragraph subtitle = new Paragraph("Comprobante de venta (no fiscal)", normalFont);
            subtitle.setSpacingAfter(16f);
            document.add(subtitle);

            PdfPTable meta = new PdfPTable(new float[]{1, 1});
            meta.setWidthPercentage(100);

            PdfPCell left = new PdfPCell();
            left.setBorder(0);
            left.addElement(new Paragraph("Factura N\u00BA", labelFont));
            left.addElement(new Paragraph(invoice.getInvoiceNumber(), normalFont));
            left.addElement(new Paragraph("Fecha de emisión", labelFont));
            left.addElement(new Paragraph(
                    invoice.getIssueDate() != null ? invoice.getIssueDate().format(DATE_FMT) : "-", normalFont));
            left.addElement(new Paragraph("Emitida por", labelFont));
            left.addElement(new Paragraph(invoice.getCreatedByName(), normalFont));

            PdfPCell right = new PdfPCell();
            right.setBorder(0);
            right.addElement(new Paragraph("Cliente", labelFont));
            right.addElement(new Paragraph(invoice.getCustomerCompanyName(), normalFont));
            if (invoice.getCustomerContactName() != null) {
                right.addElement(new Paragraph(invoice.getCustomerContactName(), normalFont));
            }
            if (invoice.getCustomerEmail() != null) {
                right.addElement(new Paragraph(invoice.getCustomerEmail(), normalFont));
            }
            if (invoice.getCustomerAddress() != null && !invoice.getCustomerAddress().isBlank()) {
                right.addElement(new Paragraph(invoice.getCustomerAddress(), normalFont));
            }

            meta.addCell(left);
            meta.addCell(right);
            meta.setSpacingAfter(20f);
            document.add(meta);

            PdfPTable table = new PdfPTable(new float[]{4, 2, 1, 2, 2});
            table.setWidthPercentage(100);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            for (String header : new String[]{"Producto", "SKU", "Cant.", "Precio unit.", "Subtotal"}) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(new Color(30, 58, 95));
                cell.setPadding(6f);
                table.addCell(cell);
            }

            for (InvoiceItemResponse item : invoice.getItems()) {
                table.addCell(cell(item.getProductName(), normalFont, Element.ALIGN_LEFT));
                table.addCell(cell(item.getSku(), normalFont, Element.ALIGN_LEFT));
                table.addCell(cell(String.valueOf(item.getQuantity()), normalFont, Element.ALIGN_CENTER));
                table.addCell(cell(money(item.getUnitPrice()), normalFont, Element.ALIGN_RIGHT));
                table.addCell(cell(money(item.getLineTotal()), normalFont, Element.ALIGN_RIGHT));
            }

            document.add(table);

            Paragraph total = new Paragraph("TOTAL: " + money(invoice.getTotal()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
            total.setAlignment(Element.ALIGN_RIGHT);
            total.setSpacingBefore(12f);
            document.add(total);

            Paragraph footer = new Paragraph(
                    "Documento generado automáticamente por Enterprise CRM. No válido como factura fiscal.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
            footer.setSpacingBefore(30f);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar el PDF de la factura: " + ex.getMessage(), ex);
        }
    }

    private PdfPCell cell(String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setPadding(6f);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private String money(BigDecimal value) {
        return "$ " + MONEY_FMT.format(value != null ? value : BigDecimal.ZERO);
    }
}
