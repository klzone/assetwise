/**
 * 现代化UI组件库
 * 提供增强的交互组件、美观的设计和丰富的功能
 */

'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X, Search, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// 增强按钮组件
interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  magnetic?: boolean;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    ripple = true,
    magnetic = false,
    children,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      gradient: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transform hover:scale-105',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
    };

    const addRipple = (e: React.MouseEvent) => {
      if (!ripple || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      
      setRipples(prev => [...prev, ripple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 600);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!magnetic || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * 0.2;
      const deltaY = (e.clientY - centerY) * 0.2;
      
      setMousePosition({ x: deltaX, y: deltaY });
    };

    const handleMouseLeave = () => {
      if (magnetic) {
        setMousePosition({ x: 0, y: 0 });
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(e);
      onClick?.(e);
    };

    return (
      <motion.button
        ref={buttonRef}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={magnetic ? { x: mousePosition.x, y: mousePosition.y } : {}}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {/* 加载指示器 */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 内容 */}
        <motion.div
          className="flex items-center space-x-2"
          initial={false}
          animate={{ opacity: loading ? 0 : 1 }}
        >
          {icon && iconPosition === 'left' && (
            <span className="text-current">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="text-current">{icon}</span>
          )}
        </motion.div>

        {/* 波纹效果 */}
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </motion.button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// 智能卡片组件
interface SmartCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  tilt?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function SmartCard({
  children,
  className = '',
  hover = true,
  glow = false,
  tilt = false,
  glass = false,
  onClick,
}: SmartCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tilt) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  const tiltStyle = tilt && isHovering ? {
    transform: `perspective(1000px) rotateX(${(mousePosition.y - 150) / 10}deg) rotateY(${(mousePosition.x - 150) / 10}deg)`,
  } : {};

  return (
    <motion.div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300',
        hover && 'hover:shadow-lg',
        glow && 'hover:shadow-primary/20',
        glass && 'glass-effect',
        onClick && 'cursor-pointer',
        className
      )}
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* 发光效果 */}
      {glow && isHovering && (
        <div className="absolute inset-0 rounded-lg bg-primary/10 -z-10 blur-xl" />
      )}
      
      {children}
    </motion.div>
  );
}

// 增强输入框
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  loading?: boolean;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helper,
    icon,
    iconPosition = 'left',
    clearable = false,
    loading = false,
    value,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleClear = () => {
      if (onChange) {
        onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <motion.label
            className={cn(
              'block text-sm font-medium transition-colors',
              error ? 'text-destructive' : 'text-foreground'
            )}
            initial={false}
            animate={{ color: error ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {/* 左侧图标 */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}

          <motion.input
            ref={ref}
            type={inputType}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && iconPosition === 'left' && 'pl-10',
              (icon && iconPosition === 'right') || clearable || type === 'password' ? 'pr-10' : '',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            animate={{
              scale: isFocused ? 1.02 : 1,
              borderColor: error 
                ? 'hsl(var(--destructive))' 
                : isFocused 
                  ? 'hsl(var(--ring))' 
                  : 'hsl(var(--border))',
            }}
            transition={{ duration: 0.2 }}
            {...props}
          />

          {/* 右侧内容 */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent" />
            )}
            
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            
            {icon && iconPosition === 'right' && !clearable && !loading && type !== 'password' && (
              <div className="text-muted-foreground">{icon}</div>
            )}
          </div>
        </div>

        {/* 错误或帮助文本 */}
        <AnimatePresence>
          {(error || helper) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'text-sm',
                error ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {error || helper}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

// 智能选择器
interface SmartSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  searchable?: boolean;
  multiple?: boolean;
  className?: string;
  error?: string;
}

export function SmartSelect({
  value,
  onValueChange,
  placeholder = '请选择...',
  options,
  searchable = false,
  multiple = false,
  className = '',
  error,
}: SmartSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (value ? value.split(',') : []) : (value ? [value] : [])
  );

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      
      setSelectedValues(newValues);
      onValueChange?.(newValues.join(','));
    } else {
      setSelectedValues([optionValue]);
      onValueChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const selectedLabels = selectedValues
    .map(val => options.find(opt => opt.value === val)?.label)
    .filter(Boolean);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedLabels.length ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg"
          >
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索选项..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  无匹配选项
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'w-full flex items-center px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors',
                      selectedValues.includes(option.value) && 'bg-accent text-accent-foreground',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                  >
                    {multiple && (
                      <div className="mr-2 h-4 w-4 border border-border rounded flex items-center justify-center">
                        {selectedValues.includes(option.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    )}
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// 进度指示器
interface ProgressIndicatorProps {
  steps: Array<{ id: string; title: string; description?: string }>;
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  orientation = 'horizontal',
}: ProgressIndicatorProps) {
  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start'
    )}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isClickable = onStepClick && (isCompleted || isCurrent);

        return (
          <div key={step.id} className={cn(
            'flex items-center',
            orientation === 'horizontal' ? 'flex-row' : 'flex-col',
            index !== steps.length - 1 && orientation === 'vertical' && 'mb-8'
          )}>
            <motion.button
              className={cn(
                'flex items-center justify-center rounded-full border-2 transition-all duration-200',
                'h-10 w-10 text-sm font-medium',
                isCompleted && 'bg-primary border-primary text-primary-foreground',
                isCurrent && 'border-primary text-primary bg-primary/10',
                !isCompleted && !isCurrent && 'border-muted text-muted-foreground',
                isClickable && 'cursor-pointer hover:scale-110'
              )}
              onClick={() => isClickable && onStepClick(step.id)}
              whileHover={isClickable ? { scale: 1.1 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </motion.button>

            {orientation === 'horizontal' && index < steps.length - 1 && (
              <motion.div
                className={cn(
                  'h-0.5 mx-4 transition-all duration-300',
                  isCompleted ? 'bg-primary w-16' : 'bg-muted w-12'
                )}
                initial={{ width: 0 }}
                animate={{ width: isCompleted ? 64 : 48 }}
              />
            )}

            {orientation === 'vertical' && (
              <div className="ml-4">
                <h4 className={cn(
                  'font-medium transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}