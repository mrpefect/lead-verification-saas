import os
import asyncio
import logging
import resend

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


def _verification_email_html(name: str, verify_link: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 40px;color:#ffffff;">
              <div style="display:inline-block;width:40px;height:40px;background:#ffffff;border-radius:10px;text-align:center;line-height:40px;font-weight:700;color:#2563eb;font-size:20px;">L</div>
              <h1 style="margin:16px 0 4px 0;font-size:22px;font-weight:700;color:#ffffff;">LeadVerify AI</h1>
              <p style="margin:0;font-size:13px;color:#bfdbfe;">CRM & Automation Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#0f172a;">Hi {name}, welcome aboard!</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                Thanks for signing up for LeadVerify AI. Before you can access your dashboard,
                please verify your email address by clicking the button below.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:10px;">
                    <a href="{verify_link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Verify my email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#2563eb;word-break:break-all;">
                <a href="{verify_link}" style="color:#2563eb;text-decoration:underline;">{verify_link}</a>
              </p>
              <p style="margin:0;padding-top:24px;border-top:1px solid #e2e8f0;font-size:13px;color:#94a3b8;line-height:1.6;">
                This verification link expires in 24 hours. If you didn't create an account with LeadVerify AI, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
              © LeadVerify AI · AI-powered Lead Verification & Appointment Automation
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_verification_email(recipient_email: str, name: str, verify_link: str) -> bool:
    """Send email verification link via Resend. Returns True on success, False on failure."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured. Skipping email send.")
        logger.info(f"[DEV] Verification link for {recipient_email}: {verify_link}")
        return False

    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": "Verify your email · LeadVerify AI",
        "html": _verification_email_html(name, verify_link),
    }
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Verification email sent to {recipient_email} (id={email.get('id')})")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {recipient_email}: {e}")
        # Always log the link so devs can still complete the flow if email fails
        logger.info(f"[FALLBACK] Verification link for {recipient_email}: {verify_link}")
        return False


def _password_reset_email_html(name: str, reset_link: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 40px;color:#ffffff;">
              <div style="display:inline-block;width:40px;height:40px;background:#ffffff;border-radius:10px;text-align:center;line-height:40px;font-weight:700;color:#2563eb;font-size:20px;">L</div>
              <h1 style="margin:16px 0 4px 0;font-size:22px;font-weight:700;color:#ffffff;">LeadVerify AI</h1>
              <p style="margin:0;font-size:13px;color:#bfdbfe;">Password reset request</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#0f172a;">Hi {name}, let's reset your password</h2>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                We received a request to reset your password. Click the button below to choose a new one.
                If you didn't request this, you can safely ignore this email — your password will stay the same.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:10px;">
                    <a href="{reset_link}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Reset my password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 24px 0;font-size:13px;color:#2563eb;word-break:break-all;">
                <a href="{reset_link}" style="color:#2563eb;text-decoration:underline;">{reset_link}</a>
              </p>
              <p style="margin:0;padding-top:24px;border-top:1px solid #e2e8f0;font-size:13px;color:#94a3b8;line-height:1.6;">
                This password reset link expires in 1 hour. For your security, never share this link with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#f8fafc;font-size:12px;color:#94a3b8;text-align:center;">
              © LeadVerify AI · AI-powered Lead Verification & Appointment Automation
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_password_reset_email(recipient_email: str, name: str, reset_link: str) -> bool:
    """Send password reset link via Resend. Returns True on success, False on failure."""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured. Skipping email send.")
        logger.info(f"[DEV] Password reset link for {recipient_email}: {reset_link}")
        return False

    params = {
        "from": SENDER_EMAIL,
        "to": [recipient_email],
        "subject": "Reset your password · LeadVerify AI",
        "html": _password_reset_email_html(name, reset_link),
    }
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {recipient_email} (id={email.get('id')})")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {recipient_email}: {e}")
        logger.info(f"[FALLBACK] Password reset link for {recipient_email}: {reset_link}")
        return False
