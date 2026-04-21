describe('logger', () => {
  let logger: typeof import('./logger').logger;
  let stdoutSpy: jest.SpyInstance;

  // Helper to mock config before importing logger
  function setConfig(overrides: Partial<{ LOGGING_ENABLED: boolean; LOGGING_LEVEL: string; LOGGING_FORMAT: string }>) {
    jest.resetModules();
    jest.doMock('./config', () => ({
      config: {
        LOGGING_ENABLED: true,
        LOGGING_LEVEL: 'debug',
        LOGGING_FORMAT: 'json',
        ...overrides,
      },
    }));
    logger = require('./logger').logger;
  }

  beforeEach(() => {
    jest.resetModules();
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('logs debug when enabled and level is debug', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'debug', LOGGING_FORMAT: 'json' });

    // Act
    logger.debug({ foo: 'bar' }, 'debug message');

    // Assert
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
    expect(output).toContain('debug message');
    expect(output).toContain('foo');
  });

  it('does not log debug if level is info', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'info' });

    // Act
    logger.debug('should not log');

    // Assert
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('logs info when enabled and level is info', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'info', LOGGING_FORMAT: 'json' });

    // Act
    logger.info('info message');

    // Assert
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
    expect(output).toContain('info message');
  });

  it('does not log info if level is warn', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'warn' });

    // Act
    logger.info('should not log');

    // Assert
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('logs warn when enabled and level is warn', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'warn', LOGGING_FORMAT: 'json' });

    // Act
    logger.warn({ a: 1 }, 'warn message');

    // Assert
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
    expect(output).toContain('warn message');
    expect(output).toContain('a');
  });

  it('logs error with error object', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'error', LOGGING_FORMAT: 'json' });
    const error = new Error('fail');

    // Act
    logger.error({ error, foo: 1 }, 'error message');

    // Assert
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
    expect(output).toContain('error message');
    expect(output).toContain('error');
    expect(output).toContain('foo');
  });

  it('logs error without error object', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'error', LOGGING_FORMAT: 'json' });

    // Act
    logger.error('error message');

    // Assert
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
    expect(output).toContain('error message');
  });

  it('does not log if LOGGING_ENABLED is false', () => {
    // Arrange
    setConfig({ LOGGING_ENABLED: false, LOGGING_LEVEL: 'debug' });

    // Act
    logger.debug('should not log');
    logger.info('should not log');
    logger.warn('should not log');
    logger.error('should not log');

    // Assert
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  describe('JSON format', () => {
    it('logs as JSON when LOGGING_FORMAT is json', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'info', LOGGING_FORMAT: 'json' });

      // Act
      logger.info({ userId: 123 }, 'test message');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      // Verify that JSON output was written (pino writes to stdout)
      const allOutput = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(allOutput).toContain('test message');
      expect(allOutput).toContain('userId');
    });

    it('logs context as separate fields in JSON format', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'debug', LOGGING_FORMAT: 'json' });

      // Act
      logger.debug({ requestId: 'abc-123', duration: 250 }, 'processing request');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      // Verify that JSON output was written with context fields
      const allOutput = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(allOutput).toContain('processing request');
      expect(allOutput).toContain('abc-123');
      expect(allOutput).toContain('250');
    });

    it('logs error details in JSON format', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'error', LOGGING_FORMAT: 'json' });
      const error = new Error('test error');

      // Act
      logger.error({ error, operation: 'getData' }, 'operation failed');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      // Verify that JSON output was written with error details
      const allOutput = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(allOutput).toContain('operation failed');
      expect(allOutput).toContain('error');
      expect(allOutput).toContain('getData');
    });
  });

  describe('text format', () => {
    it('logs as text when LOGGING_FORMAT is text', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'info', LOGGING_FORMAT: 'text' });

      // Act
      logger.info({ userId: 123 }, 'test message');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(output).toContain('test message');
      expect(output).toContain('userId');
    });

    it('logs with context as separate fields in text format', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'warn', LOGGING_FORMAT: 'text' });

      // Act
      logger.warn({ code: 'WARN_001' }, 'warning message');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(output).toContain('warning message');
      expect(output).toContain('WARN_001');
    });

    it('logs error with error details in text format', () => {
      // Arrange
      setConfig({ LOGGING_ENABLED: true, LOGGING_LEVEL: 'error', LOGGING_FORMAT: 'text' });
      const error = new Error('test error');

      // Act
      logger.error({ error }, 'operation failed');

      // Assert
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls.map((call) => call[0] as string).join('');
      expect(output).toContain('operation failed');
      expect(output).toContain('error');
    });
  });
});
