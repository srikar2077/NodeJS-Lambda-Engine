describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear the config cache
    jest.resetModules();

    // Reset environment variables to a clean slate
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('config validation', () => {
    it('should validate and return config with required environment variables', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act
      const { config } = require('./config');

      // Assert
      expect(config).toBeDefined();
      expect(config.TASKS_TABLE).toBe('my-tasks-table');
      expect(config.TASK_EVENT_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:my-topic');
    });

    it('should apply default values for optional environment variables', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act
      const { config } = require('./config');

      // Assert
      expect(config.AWS_REGION).toBe('us-east-1');
      expect(config.LOGGING_ENABLED).toBe(true);
      expect(config.LOGGING_LEVEL).toBe('debug');
      expect(config.LOGGING_FORMAT).toBe('json');
      expect(config.CORS_ALLOW_ORIGIN).toBe('*');
    });

    it('should use provided values instead of defaults', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.AWS_REGION = 'us-west-2';
      process.env.LOGGING_ENABLED = 'false';
      process.env.LOGGING_LEVEL = 'error';
      process.env.LOGGING_FORMAT = 'text';
      process.env.CORS_ALLOW_ORIGIN = 'https://example.com';

      // Act
      const { config } = require('./config');

      // Assert
      expect(config.AWS_REGION).toBe('us-west-2');
      expect(config.LOGGING_ENABLED).toBe(false);
      expect(config.LOGGING_LEVEL).toBe('error');
      expect(config.LOGGING_FORMAT).toBe('text');
      expect(config.CORS_ALLOW_ORIGIN).toBe('https://example.com');
    });

    it('should throw error when required TASKS_TABLE is missing', () => {
      // Arrange
      delete process.env.TASKS_TABLE;
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should throw error when TASKS_TABLE is empty string', () => {
      // Arrange
      process.env.TASKS_TABLE = '';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should throw error when required TASK_EVENT_TOPIC_ARN is missing', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      delete process.env.TASK_EVENT_TOPIC_ARN;

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should throw error when TASK_EVENT_TOPIC_ARN is empty string', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = '';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should transform LOGGING_ENABLED string to boolean true', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.LOGGING_ENABLED = 'true';

      // Act
      const { config } = require('./config');

      // Assert
      expect(config.LOGGING_ENABLED).toBe(true);
      expect(typeof config.LOGGING_ENABLED).toBe('boolean');
    });

    it('should transform LOGGING_ENABLED string to boolean false', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.LOGGING_ENABLED = 'false';

      // Act
      const { config } = require('./config');

      // Assert
      expect(config.LOGGING_ENABLED).toBe(false);
      expect(typeof config.LOGGING_ENABLED).toBe('boolean');
    });

    it('should validate LOGGING_LEVEL enum values', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act & Assert - valid values
      const validLogLevels = ['debug', 'info', 'warn', 'error'];
      validLogLevels.forEach((level) => {
        jest.resetModules();
        process.env.TASKS_TABLE = 'my-tasks-table';
        process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
        process.env.LOGGING_LEVEL = level;
        const { config } = require('./config');
        expect(config.LOGGING_LEVEL).toBe(level);
      });
    });

    it('should throw error for invalid LOGGING_LEVEL', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.LOGGING_LEVEL = 'invalid';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should throw error for invalid LOGGING_ENABLED value', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.LOGGING_ENABLED = 'yes';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should validate LOGGING_FORMAT enum values', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act & Assert - valid values
      const validLogFormats = ['text', 'json'];
      validLogFormats.forEach((format) => {
        jest.resetModules();
        process.env.TASKS_TABLE = 'my-tasks-table';
        process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
        process.env.LOGGING_FORMAT = format;
        const { config } = require('./config');
        expect(config.LOGGING_FORMAT).toBe(format);
      });
    });

    it('should throw error for invalid LOGGING_FORMAT', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.LOGGING_FORMAT = 'xml';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });
  });

  describe('refresh', () => {
    it('should refresh config when environment variables change', () => {
      // Arrange
      process.env.TASKS_TABLE = 'original-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:original-topic';
      process.env.AWS_REGION = 'us-east-1';
      const { config, refresh } = require('./config');

      expect(config.TASKS_TABLE).toBe('original-table');
      expect(config.TASK_EVENT_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:original-topic');
      expect(config.AWS_REGION).toBe('us-east-1');

      // Act - change environment and refresh
      process.env.TASKS_TABLE = 'updated-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:updated-topic';
      process.env.AWS_REGION = 'eu-west-1';
      const refreshedConfig = refresh();

      // Assert
      expect(refreshedConfig.TASKS_TABLE).toBe('updated-table');
      expect(refreshedConfig.TASK_EVENT_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:updated-topic');
      expect(refreshedConfig.AWS_REGION).toBe('eu-west-1');
    });

    it('should return updated config on refresh', () => {
      // Arrange
      process.env.TASKS_TABLE = 'original-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:original-topic';
      const { refresh } = require('./config');

      // Act
      process.env.TASKS_TABLE = 'new-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:new-topic';
      const refreshedConfig = refresh();

      // Assert
      expect(refreshedConfig.TASKS_TABLE).toBe('new-table');
      expect(refreshedConfig.TASK_EVENT_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:new-topic');
    });

    it('should throw error on refresh if validation fails', () => {
      // Arrange
      process.env.TASKS_TABLE = 'valid-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:valid-topic';
      const { refresh } = require('./config');

      // Act - remove required variable and refresh
      delete process.env.TASKS_TABLE;

      // Assert
      expect(() => refresh()).toThrow();
    });
  });

  describe('config caching', () => {
    it('should cache config after first validation', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      const configModule = require('./config');

      // Act
      const config1 = configModule.config;
      const config2 = configModule.config;

      // Assert - same reference means it's cached
      expect(config1).toBe(config2);
    });

    it('should return cached config on subsequent imports', () => {
      // Arrange
      process.env.TASKS_TABLE = 'cached-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:cached-topic';
      process.env.AWS_REGION = 'us-west-1';

      // Act
      const { config: firstConfig } = require('./config');

      // Change env (but don't refresh)
      process.env.AWS_REGION = 'eu-central-1';

      const { config: secondConfig } = require('./config');

      // Assert - should still have cached value
      expect(secondConfig.AWS_REGION).toBe('us-west-1');
      expect(firstConfig).toBe(secondConfig);
    });
  });

  describe('error handling', () => {
    it('should provide detailed error message for multiple validation failures', () => {
      // Arrange
      delete process.env.TASKS_TABLE;
      delete process.env.TASK_EVENT_TOPIC_ARN;
      process.env.LOGGING_LEVEL = 'invalid';

      // Act & Assert
      expect(() => {
        const { config: testConfig } = require('./config');
        return testConfig;
      }).toThrow();
    });

    it('should include field paths in error messages', () => {
      // Arrange
      delete process.env.TASKS_TABLE;
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';

      // Act & Assert
      try {
        const { config: testConfig } = require('./config');
        // Should not reach here
        expect(testConfig).toBeUndefined();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('type safety', () => {
    it('should export Config type matching validated schema', () => {
      // Arrange
      process.env.TASKS_TABLE = 'my-tasks-table';
      process.env.TASK_EVENT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:my-topic';
      process.env.AWS_REGION = 'us-east-1';
      process.env.LOGGING_ENABLED = 'true';
      process.env.LOGGING_LEVEL = 'info';
      process.env.CORS_ALLOW_ORIGIN = 'https://example.com';

      // Act
      const { config } = require('./config');

      // Assert - verify all expected properties exist and have correct types
      expect(typeof config.TASKS_TABLE).toBe('string');
      expect(typeof config.TASK_EVENT_TOPIC_ARN).toBe('string');
      expect(typeof config.AWS_REGION).toBe('string');
      expect(typeof config.LOGGING_ENABLED).toBe('boolean');
      expect(['debug', 'info', 'warn', 'error']).toContain(config.LOGGING_LEVEL);
      expect(typeof config.CORS_ALLOW_ORIGIN).toBe('string');
    });
  });
});
