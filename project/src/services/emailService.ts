import { Bill, Company, EmailTemplate, ReminderLog, CompanyCC } from '../types';
import { emailTemplate } from '../data/mockData';

export class EmailService {
  private static n8nWebhookUrl = 'https://n8n.srv954870.hstgr.cloud/webhook/e012ebe8-18a3-401b-a72a-e4fdeba3395d';
  
  static async sendConsolidatedReminder(
    bills: Bill[],
    company: Company,
    ccEmails: CompanyCC[],
    type: 'manual' | 'automatic'
  ): Promise<{ success: boolean; message: string; log: ReminderLog }> {
    const totalAmount = bills.reduce((sum, bill) => sum + bill.pendingAmount, 0);

    const billsTableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Bill No</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Date</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">PO No</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Amount</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          ${bills.map(bill => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${bill.billNo}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${bill.date}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${bill.poNo}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">₹${bill.pendingAmount.toLocaleString()}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">${bill.dueDays}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb;">Total</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">₹${totalAmount.toLocaleString()}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;"></td>
          </tr>
        </tfoot>
      </table>
    `;

    const processedSubject = emailTemplate.subject
      .replace(/{{companyName}}/g, company.name);

    const processedBody = emailTemplate.body
      .replace(/{{companyName}}/g, company.name)
      .replace(/{{billsTable}}/g, billsTableHTML)
      .replace(/{{totalAmount}}/g, totalAmount.toLocaleString());

    const ccEmailAddresses = ccEmails.map(cc => cc.email);

    const webhookPayload = {
      type: 'consolidated_payment_reminder',
      timestamp: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        address: company.address,
        city: company.city,
        phone: company.phone,
        paymentTerms: company.paymentTermsDays
      },
      bills: bills.map(bill => ({
        id: bill.id,
        billNo: bill.billNo,
        date: bill.date,
        amount: bill.billAmount,
        pendingAmount: bill.pendingAmount,
        dueDays: bill.dueDays,
        poNo: bill.poNo
      })),
      summary: {
        totalBills: bills.length,
        totalAmount: totalAmount
      },
      email: {
        subject: processedSubject,
        body: processedBody,
        to: company.email,
        cc: ccEmailAddresses,
        from: 'accounts@yourcompany.com'
      },
      reminderType: type
    };

    const log: ReminderLog = {
      id: `log-${Date.now()}`,
      companyId: company.id,
      billIds: bills.map(b => b.id),
      companyName: company.name,
      billNumbers: bills.map(b => b.billNo),
      sentAt: new Date().toISOString(),
      type,
      status: 'sent',
      emailTo: company.email,
      emailCC: ccEmailAddresses
    };

    try {
      console.log('Sending consolidated reminder to n8n webhook:', this.n8nWebhookUrl);
      console.log('Payload:', JSON.stringify(webhookPayload, null, 2));

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('n8n webhook response:', responseData);

      return {
        success: true,
        message: `Consolidated reminder sent to ${company.name} with ${bills.length} bills (Total: ₹${totalAmount.toLocaleString()})`,
        log
      };

    } catch (error) {
      console.error('Error sending webhook to n8n:', error);

      log.status = 'failed';

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        message: `Failed to send consolidated reminder to ${company.name}: ${errorMessage}`,
        log
      };
    }
  }

  static async sendReminder(
    bill: Bill,
    company: Company,
    type: 'manual' | 'automatic'
  ): Promise<{ success: boolean; message: string; log: ReminderLog }> {
    
    // Process email template
    const processedSubject = emailTemplate.subject
      .replace(/{{companyName}}/g, company.name)
      .replace(/{{billNo}}/g, bill.billNo);
    
    const processedBody = emailTemplate.body
      .replace(/{{companyName}}/g, company.name)
      .replace(/{{billNo}}/g, bill.billNo)
      .replace(/{{billDate}}/g, bill.date)
      .replace(/{{billAmount}}/g, bill.billAmount.toLocaleString())
      .replace(/{{dueDays}}/g, bill.dueDays.toString());

    // Prepare webhook payload
    const webhookPayload = {
      type: 'payment_reminder',
      timestamp: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        address: company.address,
        city: company.city,
        phone: company.phone
      },
      bill: {
        id: bill.id,
        billNo: bill.billNo,
        date: bill.date,
        amount: bill.billAmount,
        pendingAmount: bill.pendingAmount,
        dueDays: bill.dueDays,
        poNo: bill.poNo
      },
      email: {
        subject: processedSubject,
        body: processedBody,
        to: company.email,
        from: 'accounts@yourcompany.com'
      },
      reminderType: type,
      reminderCount: bill.reminderCount + 1
    };

    const log: ReminderLog = {
      id: `log-${Date.now()}`,
      companyId: company.id,
      billIds: [bill.id],
      companyName: company.name,
      billNumbers: [bill.billNo],
      sentAt: new Date().toISOString(),
      type,
      status: 'sent',
      emailTo: company.email,
      emailCC: []
    };

    try {
      console.log('Sending to n8n webhook:', this.n8nWebhookUrl);
      console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
      
      // Make actual POST request to n8n webhook
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('n8n webhook response:', responseData);

      // Update log status to sent
      log.status = 'sent';
      
      return {
        success: true,
        message: `Reminder sent successfully to ${company.name} for bill ${bill.billNo}`,
        log
      };
      
    } catch (error) {
      console.error('Error sending webhook to n8n:', error);
      
      // Update log status to failed
      log.status = 'failed';
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        message: `Failed to send reminder to ${company.name} for bill ${bill.billNo}: ${errorMessage}`,
        log
      };
    }
  }

  static async sendBulkReminders(
    bills: Bill[], 
    company: Company
  ): Promise<{ success: boolean; results: any[]; summary: { total: number; sent: number; failed: number; skipped: number } }> {
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    
    for (const bill of bills) {
      if (!bill.isReminderPaused) {
        try {
          const result = await this.sendReminder(bill, company, 'manual');
          results.push(result);
          
          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
          }
          
          // Add small delay between requests to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          failedCount++;
          results.push({
            success: false,
            message: `Failed to process bill ${bill.billNo}: ${error}`,
            log: {
              id: `log-${Date.now()}`,
              billId: bill.id,
              companyName: company.name,
              billNo: bill.billNo,
              sentAt: new Date().toISOString(),
              type: 'manual' as const,
              status: 'failed' as const
            }
          });
        }
      } else {
        skippedCount++;
        results.push({
          success: false,
          message: `Reminder paused for bill ${bill.billNo}`,
          log: {
            id: `log-${Date.now()}`,
            billId: bill.id,
            companyName: company.name,
            billNo: bill.billNo,
            sentAt: new Date().toISOString(),
            type: 'manual' as const,
            status: 'skipped' as const
          }
        });
      }
    }
    
    return {
      success: failedCount === 0,
      results,
      summary: {
        total: bills.length,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount
      }
    };
  }

  // Optional: Method to test webhook connection
  static async testWebhookConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testPayload = {
        type: 'connection_test',
        timestamp: new Date().toISOString(),
        message: 'Testing webhook connection'
      };

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      return {
        success: true,
        message: 'Webhook connection successful'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Webhook connection failed: ${errorMessage}`
      };
    }
  }
}