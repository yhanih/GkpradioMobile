// MailerSend email service - Replacement for SendGrid
import { MailerSend, EmailParams as MailerSendEmailParams, Sender, Recipient } from 'mailersend';

if (!process.env.MAILERSEND_API_TOKEN) {
  console.warn("MAILERSEND_API_TOKEN not set - email notifications disabled");
}

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_TOKEN || '',
});

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.MAILERSEND_API_TOKEN) {
    return false; // Skip email in development if no API key
  }

  // Ensure at least text or html is provided
  if (!params.text && !params.html) {
    console.error('MailerSend email error: Either text or html content is required');
    return false;
  }

  try {
    // Create sender and recipient objects
    const sentFrom = new Sender(params.from, 'GKP Radio');
    const recipients = [new Recipient(params.to)];
    
    // Create email parameters
    const emailParams = new MailerSendEmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(params.subject);

    // Add content based on what's provided
    if (params.html) {
      emailParams.setHtml(params.html);
    }
    if (params.text) {
      emailParams.setText(params.text);
    }

    // Send the email
    const result = await mailerSend.email.send(emailParams);
    
    return true;
  } catch (error) {
    console.error('MailerSend email error:', error);
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

// Additional email template functions for other notification types
export function createPrayerReplyEmail(
  recipientEmail: string,
  replierName: string,
  prayerTitle: string,
  replyContent: string,
  prayerId: number
): EmailParams {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';
  const siteUrl = process.env.SITE_URL || 'https://godkingdomprinciplesradio.com';
  const prayerUrl = `${siteUrl}/#/community?prayer=${prayerId}`;
  
  return {
    to: recipientEmail,
    from: fromEmail,
    subject: "Someone replied to your prayer request",
    text: `Hello,

${replierName} has replied to your prayer request "${prayerTitle}":

"${replyContent}"

View the full prayer thread: ${prayerUrl}

May God bless you,
GKP Radio Community`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Prayer Reply</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Someone has responded to your prayer request</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello,</p>
          
          <p><strong>${replierName}</strong> has replied to your prayer request:</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">"${prayerTitle}"</h3>
            <p style="margin: 15px 0 0 0; font-style: italic;">"${replyContent}"</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${prayerUrl}" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Prayer Thread</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Your faith community is standing with you in prayer.</p>
          
          <p style="margin-top: 30px;">May God bless you,<br><strong>GKP Radio Community</strong></p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
          <p>GKP Radio - Building Faith Communities Worldwide</p>
        </div>
      </div>
    `
  };
}

export function createEventReminderEmail(
  recipientEmail: string,
  eventTitle: string,
  eventTime: string,
  eventDescription?: string
): EmailParams {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@godkingdomprinciplesradio.com';
  
  return {
    to: recipientEmail,
    from: fromEmail,
    subject: `Reminder: ${eventTitle} starts soon`,
    text: `Hello,

This is a reminder that "${eventTitle}" is starting at ${eventTime}.

${eventDescription || 'Join us for this special event!'}

Blessings,
GKP Radio Team`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Event Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Don't miss this special event</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello,</p>
          
          <p>This is a reminder that <strong>"${eventTitle}"</strong> is starting at <strong>${eventTime}</strong>.</p>
          
          ${eventDescription ? `
          <div style="background: #f8f9fa; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;">${eventDescription}</p>
          </div>
          ` : ''}
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">We look forward to seeing you there!</p>
          
          <p style="margin-top: 30px;">Blessings,<br><strong>GKP Radio Team</strong></p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #f8f9fa; color: #666; font-size: 12px;">
          <p>GKP Radio - Building Faith Communities Worldwide</p>
        </div>
      </div>
    `
  };
}