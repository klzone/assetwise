import { renderHook, act } from '@testing-library/react'
import { useFormValidation, commonRules } from '../use-form-validation'

// Mock React for testing
import * as React from 'react'

describe('useFormValidation', () => {
  const initialValues = {
    email: '',
    password: '',
    name: '',
    age: 0
  }

  const rules = {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 6 },
    name: { required: true, maxLength: 50 },
    age: { min: 18, max: 100 }
  }

  describe('初始状态', () => {
    it('应该返回初始值和空错误', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.touched).toEqual({})
      expect(result.current.isValid).toBe(true)
      expect(result.current.hasErrors).toBe(false)
    })
  })

  describe('字段验证', () => {
    it('应该验证必填字段', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      act(() => {
        result.current.setValue('email', '')
        result.current.setFieldTouched('email', true)
      })

      expect(result.current.errors.email).toBe('email 是必填项')
    })

    it('应该验证邮箱格式', () => {
      // 使用非必填的邮箱字段来测试格式验证
      const emailRules = { email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } }
      const { result } = renderHook(() => useFormValidation(initialValues, emailRules))

      act(() => {
        result.current.setValue('email', 'invalid-email')
      })

      act(() => {
        result.current.setFieldTouched('email', true)
      })



      expect(result.current.errors.email).toBe('email 格式不正确')
    })

    it('应该验证最小长度', () => {
      // 使用非必填的密码字段来测试长度验证
      const passwordRules = { password: { minLength: 6 } }
      const { result } = renderHook(() => useFormValidation(initialValues, passwordRules))

      act(() => {
        result.current.setValue('password', '123')
      })

      act(() => {
        result.current.setFieldTouched('password', true)
      })

      expect(result.current.errors.password).toBe('password 最少需要 6 个字符')
    })

    it('应该验证最大长度', () => {
      // 使用非必填的名称字段来测试长度验证
      const nameRules = { name: { maxLength: 50 } }
      const { result } = renderHook(() => useFormValidation(initialValues, nameRules))

      const longName = 'a'.repeat(51)
      act(() => {
        result.current.setValue('name', longName)
      })

      act(() => {
        result.current.setFieldTouched('name', true)
      })

      expect(result.current.errors.name).toBe('name 最多允许 50 个字符')
    })

    it('应该验证数字范围', () => {
      const ageRules = { age: { min: 18, max: 100 } }
      const { result } = renderHook(() => useFormValidation(initialValues, ageRules))

      act(() => {
        result.current.setValue('age', 15)
      })

      act(() => {
        result.current.setFieldTouched('age', true)
      })

      expect(result.current.errors.age).toBe('age 不能小于 18')

      act(() => {
        result.current.setValue('age', 150)
      })

      expect(result.current.errors.age).toBe('age 不能大于 100')
    })
  })

  describe('自定义验证', () => {
    it('应该支持自定义验证规则', () => {
      const customRules = {
        username: {
          custom: (value: string) => {
            if (value && value.includes(' ')) {
              return '用户名不能包含空格'
            }
            return null
          }
        }
      }

      const { result } = renderHook(() =>
        useFormValidation({ username: '' }, customRules)
      )

      act(() => {
        result.current.setValue('username', 'user name')
      })

      act(() => {
        result.current.setFieldTouched('username', true)
      })

      expect(result.current.errors.username).toBe('用户名不能包含空格')
    })
  })

  describe('表单验证', () => {
    it('应该验证整个表单', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      let isValid: boolean
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(false)
      expect(result.current.errors.email).toBeDefined()
      expect(result.current.errors.password).toBeDefined()
      expect(result.current.errors.name).toBeDefined()
    })

    it('应该在所有字段有效时返回 true', () => {
      const validValues = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
        age: 25
      }

      const { result } = renderHook(() => useFormValidation(validValues, rules))

      let isValid: boolean
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(true)
      expect(Object.keys(result.current.errors)).toHaveLength(0)
    })
  })

  describe('事件处理', () => {
    it('应该处理输入变化', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      const mockEvent = {
        target: { value: 'test@example.com', type: 'email' }
      } as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleChange('email')(mockEvent)
      })

      expect(result.current.values.email).toBe('test@example.com')
    })

    it('应该处理复选框变化', () => {
      const checkboxRules = { agreed: { required: true } }
      const { result } = renderHook(() => 
        useFormValidation({ agreed: false }, checkboxRules)
      )

      const mockEvent = {
        target: { checked: true, type: 'checkbox' }
      } as React.ChangeEvent<HTMLInputElement>

      act(() => {
        result.current.handleChange('agreed')(mockEvent)
      })

      expect(result.current.values.agreed).toBe(true)
    })

    it('应该处理失焦事件', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      act(() => {
        result.current.handleBlur('email')()
      })

      expect(result.current.touched.email).toBe(true)
    })
  })

  describe('重置功能', () => {
    it('应该重置表单到初始状态', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      act(() => {
        result.current.setValue('email', 'test@example.com')
        result.current.setFieldTouched('email', true)
        result.current.validateForm()
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.values).toEqual(initialValues)
      expect(result.current.errors).toEqual({})
      expect(result.current.touched).toEqual({})
    })

    it('应该重置到新的值', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))
      const newValues = { email: 'new@example.com' }

      act(() => {
        result.current.reset(newValues)
      })

      expect(result.current.values.email).toBe('new@example.com')
    })
  })

  describe('getFieldProps', () => {
    it('应该返回字段属性', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, rules))

      act(() => {
        result.current.setValue('email', 'test@example.com')
        result.current.setFieldTouched('email', true)
      })

      const fieldProps = result.current.getFieldProps('email')

      expect(fieldProps.value).toBe('test@example.com')
      expect(fieldProps.onChange).toBeDefined()
      expect(fieldProps.onBlur).toBeDefined()
    })
  })
})

describe('commonRules', () => {
  it('应该包含常用的验证规则', () => {
    expect(commonRules.email.pattern).toBeDefined()
    expect(commonRules.phone.pattern).toBeDefined()
    expect(commonRules.password.minLength).toBe(6)
    expect(commonRules.strongPassword.pattern).toBeDefined()
    expect(commonRules.positiveNumber.min).toBe(0)
    expect(commonRules.required.required).toBe(true)
  })

  it('邮箱规则应该正确验证', () => {
    const emailPattern = commonRules.email.pattern
    expect(emailPattern.test('test@example.com')).toBe(true)
    expect(emailPattern.test('invalid-email')).toBe(false)
  })

  it('手机号规则应该正确验证', () => {
    const phonePattern = commonRules.phone.pattern
    expect(phonePattern.test('13812345678')).toBe(true)
    expect(phonePattern.test('12345678901')).toBe(false)
  })
})
