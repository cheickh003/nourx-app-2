import logger from '@/lib/logger';

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

class EmailServiceStub {
  async sendAccountActivation(email: string, name: string, activationUrl: string): Promise<string> {
    logger.info('Stub: sendAccountActivation', { email, name, activationUrl });
    return 'stub-email-activation-id';
  }

  async sendAccountDeactivation(email: string, name: string, reason: string): Promise<string> {
    logger.info('Stub: sendAccountDeactivation', { email, name, reason });
    return 'stub-email-deactivation-id';
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<string> {
    logger.info('Stub: sendPasswordReset', { email, name, resetUrl });
    return 'stub-email-reset-id';
  }
}

export const emailService = new EmailServiceStub();
export default emailService;

