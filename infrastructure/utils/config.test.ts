import { getConfig, getEnvironmentConfig, getTags, type Config } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return valid configuration when CDK_ENV is set', () => {
      process.env.CDK_ENV = 'dev';

      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.CDK_ENV).toBe('dev');
      expect(config.CDK_APP_NAME).toBe('nodejs-lambda-engine');
    });

    it('should return configuration with optional values', () => {
      process.env.CDK_APP_NAME = 'my-app';
      process.env.CDK_ENV = 'prd';
      process.env.CDK_ACCOUNT = '123456789012';
      process.env.CDK_REGION = 'us-east-1';
      process.env.CDK_OU = 'srikar2077';
      process.env.CDK_OWNER = 'platform-team';
      process.env.CDK_CORS_ALLOW_ORIGIN = 'https://example.com';
      process.env.CDK_APP_LOGGING_ENABLED = 'false';
      process.env.CDK_APP_LOGGING_LEVEL = 'warn';
      process.env.CDK_APP_LOGGING_FORMAT = 'text';
      process.env.CDK_USE_LOCALSTACK = 'false';
      process.env.CDK_LOCALSTACK_ENDPOINT = 'http://localhost:4566';

      const config = getConfig();

      expect(config).toEqual({
        CDK_APP_NAME: 'my-app',
        CDK_ENV: 'prd',
        CDK_ACCOUNT: '123456789012',
        CDK_REGION: 'us-east-1',
        CDK_OU: 'srikar2077',
        CDK_OWNER: 'platform-team',
        CDK_CORS_ALLOW_ORIGIN: 'https://example.com',
        CDK_APP_LOGGING_ENABLED: false,
        CDK_APP_LOGGING_LEVEL: 'warn',
        CDK_APP_LOGGING_FORMAT: 'text',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      });
    });

    it('should throw error when CDK_ENV is missing', () => {
      delete process.env.CDK_ENV;

      expect(() => getConfig()).toThrow('CDK configuration validation failed');
    });

    it('should throw error when CDK_ENV is invalid', () => {
      process.env.CDK_ENV = 'invalid';

      expect(() => getConfig()).toThrow('CDK_ENV must be one of: dev, qat, prd');
    });

    it('should validate CDK_APP_LOGGING_FORMAT enum values', () => {
      process.env.CDK_ENV = 'dev';

      // Valid values
      const validFormats = ['text', 'json'];
      validFormats.forEach((format) => {
        jest.resetModules();
        process.env.CDK_APP_LOGGING_FORMAT = format;
        const config = getConfig();
        expect(config.CDK_APP_LOGGING_FORMAT).toBe(format);
      });
    });

    it('should throw error when CDK_APP_LOGGING_FORMAT is invalid', () => {
      process.env.CDK_ENV = 'dev';
      process.env.CDK_APP_LOGGING_FORMAT = 'xml';

      expect(() => getConfig()).toThrow('CDK configuration validation failed');
    });
  });

  describe('getTags', () => {
    it('should return standard tags', () => {
      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_OU: 'srikar2077',
        CDK_OWNER: 'platform-team',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const tags = getTags(config);

      expect(tags).toEqual({
        App: 'nodejs-lambda-engine',
        Env: 'dev',
        OU: 'srikar2077',
        Owner: 'platform-team',
      });
    });

    it('should use default values for OU and Owner when not provided', () => {
      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'qat',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const tags = getTags(config);

      expect(tags).toEqual({
        App: 'nodejs-lambda-engine',
        Env: 'qat',
        OU: 'srikar2077',
        Owner: 'unknown',
      });
    });

    it('should use custom app name in tags', () => {
      const config: Config = {
        CDK_APP_NAME: 'my-custom-app',
        CDK_ENV: 'dev',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const tags = getTags(config);

      expect(tags).toEqual({
        App: 'my-custom-app',
        Env: 'dev',
        OU: 'srikar2077',
        Owner: 'unknown',
      });
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return account and region from CDK_ACCOUNT and CDK_REGION', () => {
      process.env.CDK_ACCOUNT = '123456789012';
      process.env.CDK_REGION = 'us-west-2';

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_ACCOUNT: '123456789012',
        CDK_REGION: 'us-west-2',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toEqual({
        account: '123456789012',
        region: 'us-west-2',
      });
    });

    it('should fallback to CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION', () => {
      delete process.env.CDK_ACCOUNT;
      delete process.env.CDK_REGION;
      process.env.CDK_DEFAULT_ACCOUNT = '987654321098';
      process.env.CDK_DEFAULT_REGION = 'eu-west-1';

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toEqual({
        account: '987654321098',
        region: 'eu-west-1',
      });
    });

    it('should prefer CDK_ACCOUNT over CDK_DEFAULT_ACCOUNT', () => {
      process.env.CDK_DEFAULT_ACCOUNT = '111111111111';
      process.env.CDK_DEFAULT_REGION = 'us-east-1';

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'prd',
        CDK_ACCOUNT: '999999999999',
        CDK_REGION: 'ap-southeast-2',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toEqual({
        account: '999999999999',
        region: 'ap-southeast-2',
      });
    });

    it('should return undefined when neither account nor region are set', () => {
      delete process.env.CDK_ACCOUNT;
      delete process.env.CDK_REGION;
      delete process.env.CDK_DEFAULT_ACCOUNT;
      delete process.env.CDK_DEFAULT_REGION;

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toBeUndefined();
    });

    it('should return undefined when only account is set', () => {
      process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
      delete process.env.CDK_DEFAULT_REGION;

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toBeUndefined();
    });

    it('should return undefined when only region is set', () => {
      delete process.env.CDK_DEFAULT_ACCOUNT;
      process.env.CDK_DEFAULT_REGION = 'us-east-1';

      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'dev',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'info',
        CDK_APP_LOGGING_FORMAT: 'json',
        CDK_USE_LOCALSTACK: false,
        CDK_LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      };

      const envConfig = getEnvironmentConfig(config);

      expect(envConfig).toBeUndefined();
    });
  });

  describe('LocalStack configuration', () => {
    it('should return LocalStack defaults when LocalStack is enabled', () => {
      // Arrange
      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'local',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'debug',
        CDK_APP_LOGGING_FORMAT: 'text',
        CDK_USE_LOCALSTACK: true,
        CDK_LOCALSTACK_ENDPOINT: 'http://localstack:4566',
      };

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig).toEqual({
        account: '000000000000',
        region: 'us-east-1',
      });
    });

    it('should use custom region with LocalStack when CDK_REGION is set', () => {
      // Arrange
      const config: Config = {
        CDK_APP_NAME: 'nodejs-lambda-engine',
        CDK_ENV: 'local',
        CDK_REGION: 'eu-west-1',
        CDK_CORS_ALLOW_ORIGIN: '*',
        CDK_APP_LOGGING_ENABLED: true,
        CDK_APP_LOGGING_LEVEL: 'debug',
        CDK_APP_LOGGING_FORMAT: 'text',
        CDK_USE_LOCALSTACK: true,
        CDK_LOCALSTACK_ENDPOINT: 'http://localstack:4566',
      };

      // Act
      const envConfig = getEnvironmentConfig(config);

      // Assert
      expect(envConfig).toEqual({
        account: '000000000000',
        region: 'eu-west-1',
      });
    });

    it('should validate local environment enum value', () => {
      // Arrange
      process.env.CDK_ENV = 'local';
      process.env.CDK_USE_LOCALSTACK = 'true';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_ENV).toBe('local');
      expect(config.CDK_USE_LOCALSTACK).toBe(true);
    });

    it('should use default LocalStack endpoint when not specified', () => {
      // Arrange
      process.env.CDK_ENV = 'local';
      process.env.CDK_USE_LOCALSTACK = 'true';
      delete process.env.CDK_LOCALSTACK_ENDPOINT;

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_LOCALSTACK_ENDPOINT).toBe('http://localstack:4566');
    });

    it('should use custom LocalStack endpoint when specified', () => {
      // Arrange
      process.env.CDK_ENV = 'local';
      process.env.CDK_USE_LOCALSTACK = 'true';
      process.env.CDK_LOCALSTACK_ENDPOINT = 'http://custom-localstack:4566';

      // Act
      const config = getConfig();

      // Assert
      expect(config.CDK_LOCALSTACK_ENDPOINT).toBe('http://custom-localstack:4566');
    });
  });
});
