describe('dynamodb-client', () => {
  let dynamoDocClient: typeof import('./dynamodb-client').dynamoDocClient;
  let dynamoClient: typeof import('./dynamodb-client').dynamoClient;
  let mockLoggerInfo: jest.Mock;
  let mockInitializeDynamoDBClients: jest.Mock;
  let mockGetDynamoDBClient: jest.Mock;
  let mockGetDynamoDBDocumentClient: jest.Mock;
  let mockDynamoClient: any;
  let mockDocClient: any;

  beforeEach(() => {
    // Reset modules to clear any cached imports
    jest.resetModules();

    // Create mock client instances
    mockDynamoClient = {
      constructor: { name: 'DynamoDBClient' },
      config: { region: 'us-east-1' },
    };
    mockDocClient = {
      constructor: { name: 'DynamoDBDocumentClient' },
    };

    // Mock the lambda-utils module
    mockInitializeDynamoDBClients = jest.fn();
    mockGetDynamoDBClient = jest.fn().mockReturnValue(mockDynamoClient);
    mockGetDynamoDBDocumentClient = jest.fn().mockReturnValue(mockDocClient);

    jest.doMock('@srikar2077/lambda-utils', () => ({
      initializeDynamoDBClients: mockInitializeDynamoDBClients,
      getDynamoDBClient: mockGetDynamoDBClient,
      getDynamoDBDocumentClient: mockGetDynamoDBDocumentClient,
    }));

    // Mock the config module
    jest.doMock('./config', () => ({
      config: {
        AWS_REGION: 'us-east-1',
        TASKS_TABLE: 'test-table',
        LOGGING_ENABLED: true,
        LOGGING_LEVEL: 'info',
        CORS_ALLOW_ORIGIN: '*',
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

  describe('dynamoDBClient', () => {
    it('should initialize lambda-utils with correct configuration', () => {
      // Arrange & Act
      require('./dynamodb-client');

      // Assert
      expect(mockInitializeDynamoDBClients).toHaveBeenCalledWith(
        { region: 'us-east-1' },
        {
          convertEmptyValues: false,
          convertClassInstanceToMap: true,
          removeUndefinedValues: true,
        },
        {
          wrapNumbers: false,
        },
      );
    });

    it('should get DynamoDB client from lambda-utils', () => {
      // Arrange & Act
      const module = require('./dynamodb-client');
      dynamoClient = module.dynamoClient;

      // Assert
      expect(dynamoClient).toBeDefined();
      expect(dynamoClient.constructor.name).toBe('DynamoDBClient');
      expect(mockGetDynamoDBClient).toHaveBeenCalled();
    });

    it('should log initialization with configuration information', () => {
      // Arrange & Act
      require('./dynamodb-client');

      // Assert
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamoDbClientConfig: expect.objectContaining({
            region: 'us-east-1',
          }),
          marshallConfig: expect.objectContaining({
            convertEmptyValues: false,
            convertClassInstanceToMap: true,
            removeUndefinedValues: true,
          }),
          unmarshallConfig: expect.objectContaining({
            wrapNumbers: false,
          }),
        }),
        '[DynamoDBClient] - Initialized AWS DynamoDB client',
      );
    });
  });

  describe('dynamoDocClient', () => {
    it('should get DynamoDB Document client from lambda-utils', () => {
      // Arrange & Act
      const module = require('./dynamodb-client');
      dynamoDocClient = module.dynamoDocClient;

      // Assert
      expect(dynamoDocClient).toBeDefined();
      expect(dynamoDocClient.constructor.name).toBe('DynamoDBDocumentClient');
      expect(mockGetDynamoDBDocumentClient).toHaveBeenCalled();
    });

    it('should create Document client after DynamoDB client initialization', () => {
      // Arrange & Act
      const module = require('./dynamodb-client');
      dynamoDocClient = module.dynamoDocClient;
      dynamoClient = module.dynamoClient;

      // Assert
      expect(dynamoDocClient).toBeDefined();
      expect(dynamoClient).toBeDefined();
      expect(dynamoDocClient.constructor.name).toBe('DynamoDBDocumentClient');
      expect(mockGetDynamoDBDocumentClient).toHaveBeenCalled();
    });
  });

  describe('client initialization', () => {
    it('should initialize clients once when module is imported', () => {
      // Arrange & Act
      const module1 = require('./dynamodb-client');
      const module2 = require('./dynamodb-client');

      // Assert - same instances should be returned (singleton pattern)
      expect(module1.dynamoClient).toBe(module2.dynamoClient);
      expect(module1.dynamoDocClient).toBe(module2.dynamoDocClient);
      // initializeDynamoDBClients should only be called once during initialization
      expect(mockInitializeDynamoDBClients).toHaveBeenCalledTimes(1);
    });

    it('should pass correct configuration to initializeDynamoDBClients', () => {
      // Arrange & Act
      require('./dynamodb-client');

      // Assert
      const callArgs = mockInitializeDynamoDBClients.mock.calls[0];
      expect(callArgs[0]).toEqual({ region: 'us-east-1' });
      expect(callArgs[1]).toEqual({
        convertEmptyValues: false,
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      });
      expect(callArgs[2]).toEqual({ wrapNumbers: false });
    });

    it('should use AWS region from config', () => {
      // Arrange & Act
      require('./dynamodb-client');

      // Assert
      expect(mockInitializeDynamoDBClients).toHaveBeenCalledWith(
        expect.objectContaining({ region: 'us-east-1' }),
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('exports', () => {
    it('should export both dynamoClient and dynamoDocClient', () => {
      // Arrange & Act
      const module = require('./dynamodb-client');

      // Assert
      expect(module.dynamoClient).toBeDefined();
      expect(module.dynamoDocClient).toBeDefined();
    });

    it('should export dynamoClient as DynamoDBClient instance', () => {
      // Arrange & Act
      const { dynamoClient: client } = require('./dynamodb-client');

      // Assert
      expect(client.constructor.name).toBe('DynamoDBClient');
    });

    it('should export dynamoDocClient as DynamoDBDocumentClient instance', () => {
      // Arrange & Act
      const { dynamoDocClient: docClient } = require('./dynamodb-client');

      // Assert
      expect(docClient.constructor.name).toBe('DynamoDBDocumentClient');
    });
  });

  describe('LocalStack configuration', () => {
    it('should include endpoint and credentials when LocalStack is enabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://localstack:4566',
        },
      }));

      // Act
      require('./dynamodb-client');

      // Assert
      expect(mockInitializeDynamoDBClients).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'us-east-1',
          endpoint: 'http://localstack:4566',
          credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test',
          },
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should not include endpoint when LocalStack is disabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: false,
          LOCALSTACK_ENDPOINT: 'http://localhost:4566',
        },
      }));

      // Act
      require('./dynamodb-client');

      // Assert
      expect(mockInitializeDynamoDBClients).toHaveBeenCalledWith(
        {
          region: 'us-east-1',
        },
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should log LocalStack endpoint when enabled', () => {
      // Arrange
      jest.doMock('./config', () => ({
        config: {
          AWS_REGION: 'us-east-1',
          TASKS_TABLE: 'test-table',
          LOGGING_ENABLED: true,
          LOGGING_LEVEL: 'info',
          CORS_ALLOW_ORIGIN: '*',
          USE_LOCALSTACK: true,
          LOCALSTACK_ENDPOINT: 'http://localstack:4566',
        },
      }));

      // Act
      require('./dynamodb-client');

      // Assert
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamoDbClientConfig: expect.objectContaining({
            endpoint: 'http://localstack:4566',
            credentials: {
              accessKeyId: 'test',
              secretAccessKey: 'test',
            },
          }),
        }),
        expect.stringContaining('DynamoDBClient'),
      );
    });
  });
});
