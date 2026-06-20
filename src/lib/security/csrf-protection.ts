/**
 * CSRF (Cross-Site Request Forgery) 闃叉姢
 * 瀹炵幇CSRF浠ょ墝鐨勭敓鎴愩€侀獙璇佸拰涓棿浠?
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = '_csrf_token';
  private static readonly SECRET_HEADER = 'x-csrf-secret';
  
  // 闇€瑕丆SRF淇濇姢鐨凥TTP鏂规硶
  private static readonly PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // 鍏嶄簬CSRF妫€鏌ョ殑璺緞
  private static readonly EXEMPT_PATHS = [
    '/api/auth/callback',
    '/api/health',
    '/api/public',
  ];

  /**
   * 鐢熸垚CSRF浠ょ墝
   */
  static generateToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * 鐢熸垚CSRF瀵嗛挜
   */
  static generateSecret(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * 鍒涘缓CSRF浠ょ墝鍝堝笇
   */
  static createTokenHash(token: string, secret: string): string {
    return createHash('sha256')
      .update(`${token}:${secret}`)
      .digest('hex');
  }

  /**
   * 楠岃瘉CSRF浠ょ墝
   */
  static verifyToken(token: string, secret: string, expectedHash: string): boolean {
    try {
      const computedHash = this.createTokenHash(token, secret);
      return computedHash === expectedHash;
    } catch (error) {
      console.error('CSRF token verification error:', error);
      return false;
    }
  }

  /**
   * 浠庤姹備腑鎻愬彇CSRF浠ょ墝
   */
  static extractTokenFromRequest(request: NextRequest): string | null {
    // 浼樺厛浠庡ご閮ㄨ幏鍙?
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    if (headerToken) {
      return headerToken;
    }

    // 浠庤〃鍗曟暟鎹幏鍙?
    const formData = request.headers.get('content-type')?.includes('form');
    if (formData) {
      // 娉ㄦ剰锛氳繖閲岄渶瑕佸湪瀹為檯浣跨敤鏃惰В鏋愯〃鍗曟暟鎹?
      // 鐢变簬杩欐槸涓棿浠讹紝鎴戜滑涓昏渚濊禆澶撮儴浠ょ墝
    }

    return null;
  }

  /**
   * 妫€鏌ヨ矾寰勬槸鍚﹂渶瑕丆SRF淇濇姢
   */
  static shouldProtectPath(pathname: string): boolean {
    return !this.EXEMPT_PATHS.some(exemptPath => 
      pathname.startsWith(exemptPath)
    );
  }

  /**
   * 妫€鏌ユ柟娉曟槸鍚﹂渶瑕丆SRF淇濇姢
   */
  static shouldProtectMethod(method: string): boolean {
    return this.PROTECTED_METHODS.includes(method.toUpperCase());
  }

  /**
   * CSRF涓棿浠?
   */
  static middleware(request: NextRequest): NextResponse | null {
    const { pathname } = request.nextUrl;
    const method = request.method;

    // 妫€鏌ユ槸鍚﹂渶瑕丆SRF淇濇姢
    if (!this.shouldProtectPath(pathname) || !this.shouldProtectMethod(method)) {
      return null; // 缁х画澶勭悊璇锋眰
    }

    // 鑾峰彇CSRF浠ょ墝鍜屽瘑閽?
    const token = this.extractTokenFromRequest(request);
    const secret = request.headers.get(this.SECRET_HEADER);
    const storedHash = request.cookies.get(this.TOKEN_COOKIE)?.value;

    // 楠岃瘉浠ょ墝
    if (!token || !secret || !storedHash) {
      return new NextResponse(
        JSON.stringify({
          error: 'Missing CSRF token',
          code: 'CSRF_TOKEN_MISSING',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (!this.verifyToken(token, secret, storedHash)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return null; // 楠岃瘉閫氳繃锛岀户缁鐞嗚姹?
  }
}

/**
 * CSRF-safe fetch wrapper
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 鑾峰彇CSRF浠ょ墝
  const csrfResponse = await fetch('/api/csrf-token');
  const csrfData = await csrfResponse.json();

  if (!csrfData.token || !csrfData.secret) {
    throw new Error('Failed to obtain CSRF token');
  }

  // 璁剧疆cookie涓殑鍝堝笇鍊?
  const hash = CSRFProtection.createTokenHash(csrfData.token, csrfData.secret);
  document.cookie = `${CSRFProtection['TOKEN_COOKIE']}=${hash}; path=/; samesite=strict`;

  // 娣诲姞CSRF澶撮儴
  const headers = {
    ...options.headers,
    [CSRFProtection['TOKEN_HEADER']]: csrfData.token,
    [CSRFProtection['SECRET_HEADER']]: csrfData.secret,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

