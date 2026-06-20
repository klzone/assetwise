/**
 * 密码验证服务
 * 负责验证密码强度、格式等
 */
export class PasswordValidationService {
  /**
   * 验证密码是否符合安全要求
   * @param password 待验证的密码
   * @returns 验证结果，包含是否有效、错误信息和强度分数
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    // 检查密码长度
    if (password.length < 8) {
      errors.push('密码必须至少包含8个字符');
      return { isValid: false, errors, score: 0 };
    } else {
      score += 1;
    }

    // 检查是否包含大写字母
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少1个大写字母');
    } else {
      score += 1;
    }

    // 检查是否包含小写字母
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少1个小写字母');
    } else {
      score += 1;
    }

    // 检查是否包含数字
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含至少1个数字');
    } else {
      score += 1;
    }

    // 检查是否包含特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('密码必须包含至少1个特殊字符');
    } else {
      score += 1;
    }

    // 检查是否包含键盘上连续的字符
    const keyboardSequences = [
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm', // 横向
      'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'tgbyhn', 'yhnujm', // 纵向
      '1234567890' // 数字
    ];

    const lowercasePassword = password.toLowerCase();
    for (const sequence of keyboardSequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const fragment = sequence.substring(i, i + 3);
        if (lowercasePassword.includes(fragment) || lowercasePassword.includes(fragment.split('').reverse().join(''))) {
          errors.push('密码不应包含键盘上连续的字符');
          break;
        }
      }
    }

    // 检查常见密码
    const commonPasswords = ['password', 'admin123', '123456', 'qwerty', 'welcome'];
    if (commonPasswords.includes(lowercasePassword)) {
      errors.push('密码不能使用常见密码');
    }

    // 计算密码强度分数 (0-100)
    // 基础分数
    let strengthScore = score * 20;

    // 额外加分：长度
    strengthScore += Math.min(20, (password.length - 8) * 2);

    // 额外加分：字符多样性
    const uniqueChars = new Set(password).size;
    strengthScore += Math.min(10, uniqueChars - 5);

    // 额外加分：特殊字符数量
    const specialCharsCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    strengthScore += Math.min(10, specialCharsCount * 2);

    // 减分：存在连续字符
    if (errors.some(e => e.includes('连续的字符'))) {
      strengthScore -= 15;
    }

    // 减分：使用常见密码
    if (errors.some(e => e.includes('常见密码'))) {
      strengthScore -= 30;
    }

    // 确保分数在0-100范围内
    strengthScore = Math.max(0, Math.min(100, strengthScore));

    return {
      isValid: errors.length === 0,
      errors,
      score: strengthScore
    };
  }

  /**
   * 生成随机强密码
   * @param length 密码长度，默认为12
   * @returns 生成的强密码
   */
  static generateStrongPassword(length: number = 12): string {
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除容易混淆的字符
    const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // 排除容易混淆的字符
    const numberChars = '23456789'; // 排除容易混淆的字符
    const specialChars = '!@#$%^&*_+-=?';

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    let password = '';

    // 确保包含至少一个大写字母
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));

    // 确保包含至少一个小写字母
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));

    // 确保包含至少一个数字
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));

    // 确保包含至少一个特殊字符
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // 打乱密码字符顺序
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }
}

import { NextResponse } from 'next/server';

/**
 * 通用验证中间件
 * @param request 请求对象
 * @param validator 验证函数
 * @param handler 处理函数
 * @returns 处理结果
 */
export async function withValidation<T>(
  request: Request,
  validator: (data: any) => { isValid: boolean; errors: string[]; data?: T },
  handler: (request: Request, validatedData: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = validator(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: '数据验证失败',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    return handler(request, validation.data!);
  } catch (error) {
    return NextResponse.json(
      {
        error: '请求数据格式错误',
        details: '无法解析JSON数据'
      },
      { status: 400 }
    );
  }
}
