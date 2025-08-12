import { useState, useCallback } from 'react'

export type ValidationRule<T = any> = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: T) => string | null
  message?: string
}

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>
}

export type ValidationErrors<T> = {
  [K in keyof T]?: string
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors<T>>({})
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  const validateField = useCallback((name: keyof T, value: any): string | null => {
    const rule = rules[name]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rule.message || `${String(name)} 是必填项`
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message || `${String(name)} 最少需要 ${rule.minLength} 个字符`
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message || `${String(name)} 最多允许 ${rule.maxLength} 个字符`
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message || `${String(name)} 格式不正确`
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `${String(name)} 不能小于 ${rule.min}`
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `${String(name)} 不能大于 ${rule.max}`
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [rules])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    Object.keys(rules).forEach((key) => {
      const fieldName = key as keyof T
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField, rules])

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Validate field on change if it was touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error || undefined }))
    }
  }, [touched, validateField])

  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }))
    
    if (isTouched) {
      const error = validateField(name, values[name])
      setErrors(prev => ({ ...prev, [name]: error || undefined }))
    }
  }, [values, validateField])

  const handleChange = useCallback((name: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked
      : event.target.value
    setValue(name, value)
  }, [setValue])

  const handleBlur = useCallback((name: keyof T) => () => {
    setFieldTouched(name, true)
  }, [setFieldTouched])

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues)
    setErrors({})
    setTouched({} as Record<keyof T, boolean>)
  }, [initialValues])

  const getFieldProps = useCallback((name: keyof T) => ({
    value: values[name] || '',
    onChange: handleChange(name),
    onBlur: handleBlur(name),
    error: touched[name] ? errors[name] : undefined,
  }), [values, errors, touched, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    validateField,
    handleChange,
    handleBlur,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
  }
}

// 常用的验证规则
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址'
  },
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号码'
  },
  password: {
    minLength: 6,
    message: '密码至少需要6个字符'
  },
  strongPassword: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: '密码需要包含大小写字母和数字，至少8个字符'
  },
  positiveNumber: {
    min: 0,
    message: '请输入正数'
  },
  required: {
    required: true
  }
}
