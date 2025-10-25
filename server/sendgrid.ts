// SendGrid email service - Blueprint reference: javascript_sendgrid
import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set - email notifications disabled");
}

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Would send email:', params);
    return false; // Skip email in development if no API key
  }

  // Ensure at least text or html is provided
  if (!params.text && !params.html) {
    console.error('SendGrid email error: Either text or html content is required');
    return false;
  }

  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };

    if (params.html) {
      emailData.html = params.html;
    }
    if (params.text) {
      emailData.text = params.text;
    }

    await sgMail.send(emailData);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function createTagNotificationEmail(
  taggedEmail: string,
  taggerName: string,
  discussionTitle: string,
  discussionCategory: string,
  discussionId: number
): EmailParams {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';
  const siteUrl = process.env.SITE_URL || 'https://godkingdomprinciplesradio.com';
  const discussionUrl = `${siteUrl}/#/community?thread=${discussionId}`;
  
  return {
    to: taggedEmail,
    from: fromEmail,
    subject: "You've been tagged in a faith discussion",
    text: `Hello,

${taggerName} has tagged you in a discussion on GKP Radio Community:

"${discussionTitle}" in ${discussionCategory}

Visit the discussion: ${discussionUrl}

Blessings,
GKP Radio Community`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">GKP Radio Community</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You've been tagged in a discussion</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello,</p>
          
          <p><strong>${taggerName}</strong> has tagged you in a faith discussion:</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">"${discussionTitle}"</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">in ${discussionCategory}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${discussionUrl}" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Discussion</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Join our faith community and share in meaningful conversations that strengthen our walk with God.</p>
          
          <p style="margin-top: 30px;">Blessings,<br><strong>GKP Radio Community</strong></p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
          <p>GKP Radio - Building Faith Communities Worldwide</p>
        </div>
      </div>
    `
  };
}