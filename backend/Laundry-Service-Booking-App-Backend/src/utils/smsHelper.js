/**
 * SMS Helper for sending OTP via Twilio SMS
 * Phone numbers should already be in E.164 format from auth.service.js
 * Twilio credentials are loaded from DB (Admin → Settings → Integrations), falling back to env vars.
 */

import twilio from 'twilio';
import Settings from "../model/settings.model.js";
import { parsePhoneNumber, getCountries } from 'libphonenumber-js';

const getTwilioConfig = async () => {
  try {
    const settingsDoc = await Settings.findOne({ key: "twilioConfig" });
    const cfg = settingsDoc?.value || {};
    return {
      accountSid: cfg.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
      authToken: cfg.authToken || process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: cfg.phoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
    };
  } catch {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    };
  }
};

/**
 * Ensure phone is in E.164 format before sending SMS
 */
const ensureE164 = (phone) => {
  const cleaned = phone.trim();
  
  // Already E.164
  if (cleaned.startsWith('+')) {
    try {
      const p = parsePhoneNumber(cleaned);
      if (p && p.isValid()) return p.format('E.164');
    } catch (e) {}
    return cleaned; // return as-is if already has +
  }
  
  // Try adding + (user entered country code without +)
  try {
    const withPlus = `+${cleaned}`;
    const p = parsePhoneNumber(withPlus);
    if (p && p.isValid()) return p.format('E.164');
  } catch (e) {}
  
  // Try all countries
  const allCountries = getCountries();
  for (const country of allCountries) {
    try {
      const p = parsePhoneNumber(cleaned, country);
      if (p && p.isValid()) return p.format('E.164');
    } catch (e) { continue; }
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

export const SendOtpSms = async (phone, otp) => {
  try {
    const { accountSid, authToken, phoneNumber } = await getTwilioConfig();

    if (!accountSid || !authToken) {
      throw Object.assign(new Error('Twilio credentials not configured. Add them in Admin → Settings → Integrations.'), { code: 20003 });
    }

    const client = twilio(accountSid, authToken);
    const formattedPhone = ensureE164(phone);
    
    const messageBody = `${otp} is your verification code. For your security, do not share this code.`;
    
    const message = await client.messages.create({
      body: messageBody,
      from: phoneNumber,
      to: formattedPhone
    });

    return { 
      success: true, 
      message: 'OTP sent successfully via SMS',
      sid: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('================================================');
    console.error('❌ SMS OTP sending failed!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    // Provide helpful error messages based on Twilio error codes
    if (error.code === 21612) {
      console.error('\n🚫 TRIAL ACCOUNT LIMITATION - UNVERIFIED NUMBER');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('You can only send messages to verified phone numbers.');
      console.error('Solution 1: Verify the destination number at:');
      console.error('https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.error('Solution 2: Upgrade your Twilio account');
      console.error('➡️  FALLBACK: Will attempt to send OTP via EMAIL instead');
    } else if (error.code === 63038) {
      console.error('\n⏱️  DAILY SMS LIMIT EXCEEDED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Your Twilio trial account has reached its daily message limit.');
      console.error('Trial accounts can only send 5 messages per day.');
      console.error('Solution 1: Wait 24 hours for limit reset');
      console.error('Solution 2: Upgrade your Twilio account for unlimited messages');
      console.error('➡️  FALLBACK: Will attempt to send OTP via EMAIL instead');
    } else if (error.code === 20003) {
      console.error('\n⚠️  AUTHENTICATION ERROR:');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
    } else {
      console.error('\n❌ UNKNOWN ERROR:');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    console.error('More Info:', error.moreInfo || 'N/A');
    console.error('================================================');
    throw error;
  }
};

export const SendOtpWhatsApp = async (phone, otp) => {
  return await SendOtpSms(phone, otp);
};

export const SmsSend = async (phone, message) => {
  try {
    const otpMatch = message.match(/\d{6}/);
    const otp = otpMatch ? otpMatch[0] : '000000';
    return await SendOtpSms(phone, otp);
  } catch (error) {
    console.error('Message sending failed:', error.message);
    throw error;
  }
};
