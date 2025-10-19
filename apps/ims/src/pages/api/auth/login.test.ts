import { createMocks } from 'node-mocks-http';
import handler from './login';

describe('/api/auth/login', () => {
  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Method not allowed',
    });
  });

  it('returns 400 when email is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        password: 'test123',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Email and password are required',
    });
  });

  it('returns 400 when password is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Email and password are required',
    });
  });

  it('returns 401 for invalid credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('successfully logs in with valid demo credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'demo@partpal.co.za',
        password: 'demo123',
      },
    });

    await handler(req, res);

    // Wait for the simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('demo@partpal.co.za');
    expect(data.user.password).toBeUndefined(); // Password should not be in response
    expect(data.user.role).toBe('SELLER');
  });

  it('successfully logs in with admin credentials', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'admin@partpal.co.za',
        password: 'admin123',
      },
    });

    await handler(req, res);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('admin@partpal.co.za');
    expect(data.user.role).toBe('ADMIN');
  });

  it('sets session cookie on successful login', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'demo@partpal.co.za',
        password: 'demo123',
      },
    });

    await handler(req, res);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const setCookieHeader = res._getHeaders()['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('session=');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Strict');
  });

  it('returns user without sensitive data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'demo@partpal.co.za',
        password: 'demo123',
      },
    });

    await handler(req, res);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const data = JSON.parse(res._getData());
    expect(data.user).toBeDefined();
    expect(data.user.password).toBeUndefined();
    expect(data.user.id).toBeDefined();
    expect(data.user.email).toBeDefined();
    expect(data.user.name).toBeDefined();
    expect(data.user.role).toBeDefined();
  });
});
