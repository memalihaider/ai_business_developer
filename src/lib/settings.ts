// Settings utility functions

// Default email settings
const DEFAULT_EMAIL_SETTINGS = {
  senderName: "Largify Solutions Limited - Your Digital AI Partner",
  senderEmail: "largifysolutions@gmail.com",
  replyToEmail: "largifysolutions@gmail.com",
  enableEmailTracking: true,
};

// Get email sender name from configuration
export function getEmailSenderName(): string {
  // In a real application, this would fetch from database or localStorage
  // For now, we'll use the default or environment variable
  const customSenderName = process.env.SMTP_FROM_NAME;
  
  if (customSenderName) {
    return customSenderName;
  }
  
  // Try to get from localStorage (client-side)
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return settings.senderName || DEFAULT_EMAIL_SETTINGS.senderName;
      } catch (error) {
        console.error('Error parsing email settings:', error);
      }
    }
  }
  
  return DEFAULT_EMAIL_SETTINGS.senderName;
}

// Get email sender address
export function getEmailSenderAddress(): string {
  // Try environment variable first
  const envSender = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (envSender) {
    return envSender;
  }
  
  // Try to get from localStorage (client-side)
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return settings.senderEmail || DEFAULT_EMAIL_SETTINGS.senderEmail;
      } catch (error) {
        console.error('Error parsing email settings:', error);
      }
    }
  }
  
  return DEFAULT_EMAIL_SETTINGS.senderEmail;
}

// Format sender for email ("Name <email@domain.com>")
export function formatEmailSender(): string {
  const senderName = getEmailSenderName();
  const senderEmail = getEmailSenderAddress();
  
  if (senderEmail) {
    return `"${senderName}" <${senderEmail}>`;
  }
  
  // Fallback to environment variable format
  return process.env.SMTP_FROM || `"${senderName}" <${process.env.SMTP_USER || 'noreply@example.com'}>`;
}

// Save email settings (client-side)
export function saveEmailSettings(settings: {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  enableEmailTracking: boolean;
}) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('emailSettings', JSON.stringify(settings));
  }
}

// Get all email settings
export function getEmailSettings() {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      try {
        return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error parsing email settings:', error);
      }
    }
  }
  
  return DEFAULT_EMAIL_SETTINGS;
}