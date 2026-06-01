import { jsPDF } from 'jspdf';

/**
 * Reusable jsPDF Receipt Generator Utility
 * Generates a premium, highly formatted receipt layout.
 * 
 * @param {object} payment - Payment record
 * @param {object} profile - Tenant/PG Context details
 */
export const generateRentReceipt = (payment, profile) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Color definitions
    const navyColor = [30, 58, 138]; // #1E3A8A
    const slateColor = [100, 116, 139]; // #64748B
    const darkGray = [51, 65, 85]; // #334155
    const successColor = [16, 185, 129]; // #10B981

    // Header Banner
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 38, 'F');

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("STAYEASE PG & HOSTELS", 15, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(224, 231, 255);
    doc.text("Seamless Hostel & PG Management Solutions", 15, 25);

    // Document Type Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("RENT RECEIPT", 155, 18);

    // Status Badge
    doc.setFillColor(16, 185, 129);
    doc.rect(155, 22, 40, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("PAYMENT VERIFIED", 157, 27);

    // Main Details
    let yPos = 55;

    // Left Column: Property & Landlord info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...navyColor);
    doc.text("PROPERTY DETAILS", 15, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    const pgName = profile?.pg?.name || profile?.pg_id?.name || "StayEase Residency";
    doc.text(pgName, 15, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...slateColor);
    const address = profile?.pg?.address || profile?.pg_id?.address || "123 Main St, Tech City";
    const addressLines = doc.splitTextToSize(address, 75);
    doc.text(addressLines, 15, yPos + 12);

    const contact = profile?.pg?.contact || profile?.pg_id?.contact_number || "Support: +91 98765 43210";
    doc.text(`Contact: ${contact}`, 15, yPos + 22);

    // Right Column: Tenant info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...navyColor);
    doc.text("TENANT DETAILS", 115, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    const tenantName = payment?.tenant_id?.user_id?.name || profile?.tenant?.user_id?.name || "Valued Resident";
    doc.text(tenantName, 115, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...slateColor);
    const tenantEmail = payment?.tenant_id?.user_id?.email || profile?.tenant?.user_id?.email || "resident@stayease.com";
    doc.text(`Email: ${tenantEmail}`, 115, yPos + 12);

    const roomNumber = payment?.tenant_id?.room_id?.number || profile?.room?.number || profile?.tenant?.room_id?.number || "N/A";
    doc.text(`Room Number: Room ${roomNumber}`, 115, yPos + 17);

    const moveIn = profile?.tenant?.moveInDate ? new Date(profile.tenant.moveInDate).toLocaleDateString() : "N/A";
    doc.text(`Check-in Date: ${moveIn}`, 115, yPos + 22);

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 30, 195, yPos + 30);

    // Receipt Meta Info
    yPos = yPos + 38;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text("Receipt Date:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(payment.transaction_date || Date.now()).toLocaleDateString(), 42, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Mode:", 115, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(payment.payment_mode || "ONLINE (Razorpay)", 147, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("Reference ID:", 15, yPos + 6);
    doc.setFont("helvetica", "normal");
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.text(payment.gateway_payment_id || payment.gateway_order_id || "pay_mock_direct", 42, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Ledger Table Header
    yPos = yPos + 20;
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, 180, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...navyColor);
    doc.text("DESCRIPTION", 20, yPos + 6.5);
    doc.text("AMOUNT (INR)", 165, yPos + 6.5);

    // Ledger Table Rows
    yPos = yPos + 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...darkGray);
    
    // Room Rent Description
    const typeLabel = payment.type === 'DEPOSIT' ? 'Security Deposit' : 'Monthly Room Rent';
    doc.text(`${typeLabel} - Room ${roomNumber}`, 20, yPos + 7.5);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${payment.amount}.00`, 165, yPos + 7.5);

    // Border line under row
    doc.setDrawColor(241, 245, 249);
    doc.line(15, yPos + 12, 195, yPos + 12);

    // Totals Section
    yPos = yPos + 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...slateColor);
    doc.text("Subtotal:", 135, yPos + 7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text(`INR ${payment.amount}.00`, 165, yPos + 7);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navyColor);
    doc.setFontSize(11);
    doc.text("Total Paid:", 135, yPos + 15);
    doc.text(`INR ${payment.amount}.00`, 165, yPos + 15);

    // Double bottom total line
    doc.setDrawColor(...navyColor);
    doc.setLineWidth(0.8);
    doc.line(135, yPos + 18, 195, yPos + 18);

    // Verification Seal/Footer Note
    yPos = yPos + 38;
    
    // Draw seal circle
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.setFillColor(240, 253, 250);
    doc.ellipse(40, yPos + 15, 14, 14, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...successColor);
    doc.text("SECURED", 32, yPos + 13);
    doc.text("VERIFIED", 32, yPos + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...slateColor);
    doc.text("This receipt is a dynamically generated digital transaction acknowledgement.", 62, yPos + 11);
    doc.text("No physical signature is required. Certified secure by StayEase.", 62, yPos + 16);

    // Bottom Decorative strip
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 287, 210, 10, 'F');

    // Trigger save
    doc.save(`StayEase_Receipt_${payment.gateway_order_id || payment._id}.pdf`);
};
