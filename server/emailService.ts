import { sendEmail } from './sendgrid';
import type { PromotionalOrder } from '@shared/schema';

// Export function to send notification when someone replies to a thread
export async function sendReplyNotification(
  toEmail: string,
  threadTitle: string,
  replyContent: string,
  replyAuthor: string,
  threadId: number
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping reply notification');
    return;
  }

  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';
  const siteUrl = process.env.SITE_URL || 'https://godkingdomprinciplesradio.com';
  const threadUrl = `${siteUrl}/community#thread-${threadId}`;

  const emailContent = {
    to: toEmail,
    from: fromEmail,
    subject: `New reply to: ${threadTitle}`,
    text: `
${replyAuthor} replied to your discussion:

"${replyContent}"

View the full discussion: ${threadUrl}

---
GKP Radio Community
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Reply to Your Discussion</h2>
        <p><strong>${replyAuthor}</strong> replied:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0;">${replyContent}</p>
        </div>
        <a href="${threadUrl}" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          View Full Discussion
        </a>
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          GKP Radio Community<br>
          You're receiving this because you're following this discussion.
        </p>
      </div>
    `,
  };

  try {
    await sendEmail(emailContent);
    console.log('Reply notification email sent successfully');
  } catch (error) {
    console.error('Error sending reply notification:', error);
    // Don't throw - we don't want to fail the reply creation if email fails
  }
}

// Export function to send moderation alert
export async function sendModerationAlert(
  flaggedContent: {
    type: 'thread' | 'comment';
    id: number;
    content: string;
    author: string;
    reason: string;
  }
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping moderation alert');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'ads@gkpradio.com';
  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';

  const emailContent = {
    to: adminEmail,
    from: fromEmail,
    subject: `⚠️ Content Flagged for Moderation`,
    text: `
Content has been flagged for review:

Type: ${flaggedContent.type}
ID: ${flaggedContent.id}
Author: ${flaggedContent.author}
Reason: ${flaggedContent.reason}

Content:
${flaggedContent.content}

Please review this content in the admin panel.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff5722;">⚠️ Content Flagged for Moderation</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${flaggedContent.type}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>ID:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${flaggedContent.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Author:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${flaggedContent.author}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${flaggedContent.reason}</td>
          </tr>
        </table>
        <h3>Content:</h3>
        <div style="background: #ffe5e5; padding: 15px; border-left: 4px solid #ff5722; margin: 20px 0;">
          <p style="margin: 0;">${flaggedContent.content}</p>
        </div>
        <p style="color: #666;">Please review this content in the admin panel.</p>
      </div>
    `,
  };

  try {
    await sendEmail(emailContent);
    console.log('Moderation alert email sent successfully');
  } catch (error) {
    console.error('Error sending moderation alert:', error);
  }
}

export async function sendPromotionalOrderNotification(order: PromotionalOrder): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'ads@gkpradio.com';
  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';
  const siteUrl = process.env.SITE_URL || 'https://godkingdomprinciplesradio.com';
  
  const emailContent = {
    to: adminEmail,
    from: fromEmail,
    subject: `New Application for Review - ${order.packageType} Package`,
    text: `
New Application for Review Received!

Package Type: ${order.packageType}
Package Price: ${order.packagePrice}

Business/Ministry Details:
- Name: ${order.businessName}
- Contact Person: ${(order as any).contactPerson}
- Contact Email: ${order.contactEmail}
- Phone: ${order.phone || 'Not provided'}
- Website: ${(order as any).websiteUrl || 'Not provided'}
- Social Media: ${(order as any).socialMediaLinks || 'Not provided'}

Ministry/Business Description:
${(order as any).ministryDescription}

Additional Message:
${order.message || 'No additional message'}

Application Details:
- Application ID: #${order.id}
- Submitted: ${new Date(order.createdAt).toLocaleString()}
- Status: ${order.status}

ACTION REQUIRED: Please review the application and verify their ministry/business aligns with GKP Radio's standards.

View application details: ${siteUrl}/admin/promotional-orders/${order.id}
    `,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Application for Review</h1>
          <p style="color: #e0f2fe; margin-top: 10px;">${order.packageType} Package</p>
        </div>
        
        <div style="background: white; padding: 30px; border-left: 3px solid #fbbf24;">
          <h2 style="color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">
            Package Details
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Package Type:</td>
              <td style="padding: 8px 0; font-weight: bold;">${order.packageType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Package Price:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #059669;">${order.packagePrice}</td>
            </tr>
          </table>
          
          <h2 style="color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 30px;">
            Business/Ministry Details
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Name:</td>
              <td style="padding: 8px 0; font-weight: bold;">${order.businessName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Contact Person:</td>
              <td style="padding: 8px 0; font-weight: bold;">${(order as any).contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${order.contactEmail}" style="color: #059669; text-decoration: none;">
                  ${order.contactEmail}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
              <td style="padding: 8px 0;">${order.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Website:</td>
              <td style="padding: 8px 0;">${(order as any).websiteUrl ? `<a href="${(order as any).websiteUrl}" style="color: #059669;">${(order as any).websiteUrl}</a>` : 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Social Media:</td>
              <td style="padding: 8px 0;">${(order as any).socialMediaLinks ? (order as any).socialMediaLinks.replace(/\n/g, '<br>') : 'Not provided'}</td>
            </tr>
          </table>
          
          <h2 style="color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 30px;">
            Ministry/Business Description
          </h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563;">${(order as any).ministryDescription}</p>
          </div>
          
          ${order.message ? `
            <h2 style="color: #1f2937; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 30px;">
              Additional Message
            </h2>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #4b5563;">${order.message}</p>
            </div>
          ` : ''}
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">Review Required</h3>
            <p style="margin: 0; color: #78350f;">
              Please review this application and verify their ministry/business aligns with GKP Radio's standards.
              If approved, send a Stripe invoice for the selected package.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px; color: #6b7280;">
              <tr>
                <td>Order ID:</td>
                <td>#${order.id}</td>
              </tr>
              <tr>
                <td>Submitted:</td>
                <td>${new Date(order.createdAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Status:</td>
                <td style="color: #f59e0b; font-weight: bold;">${order.status}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
          <p>GKP Radio - Promotional Orders System</p>
          <p style="margin-top: 10px;">
            <a href="${siteUrl}/admin/promotional-orders/${order.id}" style="color: #059669;">
              View in Admin Dashboard
            </a>
          </p>
        </div>
      </div>
    `
  };
  
  // Also send a copy to the customer
  const customerEmail = {
    to: order.contactEmail,
    from: fromEmail,
    subject: `Application Received - ${order.packageType} Package`,
    text: `
Dear ${(order as any).contactPerson || order.businessName},

Thank you for submitting your application to advertise with GKP Radio!

We have received your application for the ${order.packageType} package (${order.packagePrice}/month).

Our team will review your application to ensure alignment with our Kingdom principles and values. We will contact you within 24-48 hours with the next steps.

Application Summary:
- Package: ${order.packageType}
- Price: ${order.packagePrice}/month
- Application Reference: #${order.id}

What happens next:
1. Our team will review your application and verify your ministry/business
2. If approved, we'll send you a secure payment link to finalize your package
3. Once payment is confirmed, your advertising campaign will begin

If you have any questions, please contact us at ads@gkpradio.com.

Blessings,
GKP Radio Advertising Team
    `,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Choosing GKP Radio!</h1>
        </div>
        
        <div style="background: white; padding: 30px;">
          <p style="color: #1f2937; font-size: 16px;">Dear ${order.businessName},</p>
          
          <p style="color: #4b5563; margin: 20px 0;">
            Thank you for your interest in advertising with GKP Radio! We're excited to help you reach our faithful community of listeners.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 3px solid #10b981; margin: 25px 0;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">Application Under Review</h3>
            <p style="margin: 5px 0; color: #047857;">
              We have received your application for the <strong>${order.packageType}</strong> package.
            </p>
            <p style="margin: 5px 0; color: #047857;">
              Package Price: <strong>${order.packagePrice}/month</strong>
            </p>
            <p style="margin: 5px 0; color: #047857;">
              Application Reference: <strong>#${order.id}</strong>
            </p>
          </div>
          
          <h3 style="color: #1f2937; margin-top: 30px;">What Happens Next?</h3>
          <ol style="color: #4b5563; padding-left: 20px;">
            <li style="margin: 10px 0;">Our advertising team will review your order</li>
            <li style="margin: 10px 0;">We'll contact you within 24 hours to discuss your advertising goals</li>
            <li style="margin: 10px 0;">Together, we'll finalize your package details and creative content</li>
            <li style="margin: 10px 0;">Your ads will begin running once everything is approved</li>
          </ol>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">Need Immediate Assistance?</h4>
            <p style="margin: 0; color: #78350f;">
              Contact us at: <a href="mailto:support@godkingdomprinciplesradio.com" style="color: #d97706;">
                support@godkingdomprinciplesradio.com
              </a>
            </p>
          </div>
          
          <p style="color: #4b5563; margin-top: 30px;">
            We look forward to partnering with you to share your message with our community!
          </p>
          
          <p style="color: #4b5563; margin-top: 20px;">
            Blessings,<br>
            <strong>GKP Radio Advertising Team</strong>
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
          <p>GKP Radio - Building Faith Communities Worldwide</p>
          <p style="margin-top: 10px;">
            <a href="${siteUrl}" style="color: #059669; text-decoration: none;">
              Visit our website
            </a>
          </p>
        </div>
      </div>
    `
  };
  
  try {
    // Send admin notification
    const adminEmailSent = await sendEmail(emailContent);
    
    // Send customer confirmation
    const customerEmailSent = await sendEmail(customerEmail);
    
    console.log(`Promotional order emails sent - Admin: ${adminEmailSent}, Customer: ${customerEmailSent}`);
    return adminEmailSent && customerEmailSent;
  } catch (error) {
    console.error('Error sending promotional order notification:', error);
    return false;
  }
}