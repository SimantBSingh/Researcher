import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config


class SmtpMailService:
    def send_message(self, to: str, subject: str, body: str) -> bool:
        try:
            message = MIMEMultipart()
            message['to'] = to
            message['from'] = Config.EMAIL
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT) as server:
                server.starttls()
                server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
                server.sendmail(Config.EMAIL, to, message.as_string())

            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
