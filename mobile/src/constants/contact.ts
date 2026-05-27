/** In-app support / help desk (mailto targets). Override via EXPO_PUBLIC_HELP_DESK_EMAIL. */
export const HELP_DESK_EMAIL =
  process.env.EXPO_PUBLIC_HELP_DESK_EMAIL?.trim() || 'helpdesk@gkpradio.com';

export const FEEDBACK_EMAIL =
  process.env.EXPO_PUBLIC_FEEDBACK_EMAIL?.trim() || 'feedback@gkpradio.com';

/** Pre-filled subject for safety / moderation reports from in-app links. */
export const SAFETY_REPORT_EMAIL_SUBJECT = 'GKP Radio App — Report inappropriate activity';
