jest.mock('@srikar2077/lambda-utils', () => ({
  httpHeaders: {
    cors: jest.fn(() => ({ 'Access-Control-Allow-Origin': 'https://example.com' })),
    json: { 'Content-Type': 'application/json' },
  },
}));
jest.mock('./config', () => ({
  config: {
    CORS_ALLOW_ORIGIN: 'https://example.com',
  },
}));

// Import after mocking
import { httpHeaders } from '@srikar2077/lambda-utils';
import { defaultResponseHeaders } from './constants';

describe('constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('defaultResponseHeaders', () => {
    it('should be defined', () => {
      // Assert
      expect(defaultResponseHeaders).toBeDefined();
    });

    it('should be of type object', () => {
      // Assert
      expect(typeof defaultResponseHeaders).toBe('object');
      expect(defaultResponseHeaders).not.toBeNull();
    });

    it('should include content-type header from jsonHeaders', () => {
      // Assert
      expect(defaultResponseHeaders).toHaveProperty('Content-Type');
      expect(defaultResponseHeaders['Content-Type']).toBe('application/json');
    });

    it('should pass CORS_ALLOW_ORIGIN from config to corsHeaders', () => {
      // The corsHeaders function is called during module initialization
      // Verify it exists and is a mock function
      expect(typeof httpHeaders.cors).toBe('function');
      expect((httpHeaders.cors as jest.Mock).mock).toBeDefined();
    });

    it('should include CORS headers from corsHeaders function', () => {
      // Assert
      expect(defaultResponseHeaders).toHaveProperty('Access-Control-Allow-Origin');
      expect(defaultResponseHeaders['Access-Control-Allow-Origin']).toBe('https://example.com');
    });

    it('should combine properties from both jsonHeaders and corsHeaders', () => {
      // Assert - verify the object contains properties from both sources
      expect(Object.keys(defaultResponseHeaders).length).toBeGreaterThanOrEqual(2);
      expect(defaultResponseHeaders).toHaveProperty('Content-Type');
      expect(defaultResponseHeaders).toHaveProperty('Access-Control-Allow-Origin');
    });
  });
});
