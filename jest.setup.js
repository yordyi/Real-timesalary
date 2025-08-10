import '@testing-library/jest-dom'

// Mock window.crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  },
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.location with a more flexible approach
global.window = Object.create(window)
global.window.location = {
  hostname: 'localhost',
  protocol: 'http:',
  port: '3000',
  host: 'localhost:3000',
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
  reload: jest.fn()
}

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

// Mock Response object
global.Response = class Response {
  constructor(body, init = {}) {
    this.ok = (init.status || 200) >= 200 && (init.status || 200) < 300
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map()
  }
}

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
  
  // Reset clipboard mock
  navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
  }
})