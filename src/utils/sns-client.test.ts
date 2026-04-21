describe('sns-client', () => {
  let snsClient: typeof import('./sns-client').snsClient;
  let mockLoggerInfo: jest.Mock;
  let mockSNSClient: any;

  beforeEach(() => {
    // Reset modules to clear any cached imports
    jest.resetModules();

    // Mock SNSClient constructor
    mockSNSClient = {
      constructor: { name: 'SNSClient' },
      config: {},
    };

    jest.doMock('@aws-sdk/client-sns', () => ({
      SNSClient: jest.fn().mockImplementation((config) => {
        mockSNSClient.config = config;
        return mockSNSClient;
      }),
    }));

    // Mock the config module
    jest.doMock('./config', () => ({
      config: {
        AWS_REGION: 'us-east-1',
        TASKS_TABLE: 'test-table',
        TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
        LOGGING_ENABLED: true,
        LOGGING_LEVEL: 'info',
        CORS_ALLOW_ORIGIN: '*',
        USE_LOCALSTACK: false,
        LOCALSTACK_ENDPOINT: 'http://localhost:4566',
      },
    }));

    // Mock the logger module
    mockLoggerInfo = jest.fn();
    jest.doMock('./logger', () => ({
      logger: {
        info: mockLoggerInfo,
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('snsClient', () => {
    it('should initialize SNS client with correct region', () => {
      // Arrange & Act
      const module = require('./sns-client');
      snsClient = module.snsClient;

      // Assert
      expect(snsClient).toBeDefined();
      expect(mockSNSClient.config).toEqual({
        region: 'us-east-1',
      });
    });

    it('should create SNSClient instance', () => {
      // Arrange & Act
      const module = require('./sns-client');
      snsClient = module.snsClient;

      // Assert
      expect(snsClient.constructor.name).toBe('SNSClient');
    });

    it('should log initialization with configuration information', () => {
      // Arrange & Act
      require('./sns-client');

      // Assert
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          snsClientConfig: expect.objectContaining({
            region: 'us-east-1',
          }),
        }),
        expect.stringContaining('[SNSClient]'),
      );
    });

    it('should use AWS region from config', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'eu-west-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:eu-west-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: false,
          LOCALSTACK_ENDPOINT: 'http://localhost:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockSNSClient.config).toEqual({
        region: 'eu-west-1',
      });
    });
  });

  describe('exports', () => {
    it('should export snsClient', () => {
      // Arrange & Act
      const module = require('./sns-client');

      // Assert
      expect(module.snsClient).toBeDefined();
    });

    it('should export snsClient as SNSClient instance', () => {
      // Arrange & Act
      const { snsClient: client } = require('./sns-client');

      // Assert
      expect(client.constructor.name).toBe('SNSClient');
    });
  });

  describe('LocalStack configuration', () => {
    it('should include endpoint and credentials when LocalStack is enabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://localstack:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockSNSClient.config).toEqual({
        region: 'us-east-1',
        endpoint: 'http://localstack:4566',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      });
    });

    it('should not include endpoint when LocalStack is disabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: false,
          LOCALSTACK_ENDPOINT: 'http://localhost:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockSNSClient.config).toEqual({
        region: 'us-east-1',
      });
    });

    it('should log LocalStack endpoint when enabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://localstack:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          snsClientConfig: expect.objectContaining({
            region: 'us-east-1',
            endpoint: 'http://localstack:4566',
            credentials: {
              accessKeyId: 'test',
              secretAccessKey: 'test',
            },
          }),
        }),
        expect.stringContaining('[SNSClient]'),
      );
    });

    it('should use custom LocalStack endpoint from config', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://custom-localstack:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockSNSClient.config).toEqual(
        expect.objectContaining({
          endpoint: 'http://custom-localstack:4566',
        }),
      );
    });

    it('should use test credentials for LocalStack', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          TASK_EVENT_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://localstack:4566',
        },
      }));

      // Act
      require('./sns-client');

      // Assert
      expect(mockSNSClient.config).toEqual(
        expect.objectContaining({
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test',
          },
        }),
      );
    });
  });

  describe('client initialization', () => {
    it('should initialize client once when module is imported', () => {
      // Arrange
      const SNSClient = require('@aws-sdk/client-sns').SNSClient;

      // Act
      require('./sns-client');
      require('./sns-client'); // Import again

      // Assert - SNSClient should be called only once despite multiple imports
      expect(SNSClient).toHaveBeenCalledTimes(1);
    });

    it('should pass correct configuration to SNSClient constructor', () => {
      // Arrange
      const SNSClient = require('@aws-sdk/client-sns').SNSClient;

      // Act
      require('./sns-client');

      // Assert
      expect(SNSClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'us-east-1',
        }),
      );
    });
  });
});
