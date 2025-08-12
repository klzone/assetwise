import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

interface BaseFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url"
  placeholder?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  autoComplete?: string
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  rows?: number
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

// 输入框字段
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, className, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              isPassword && "pr-10"
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <p className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  }
)
InputField.displayName = "InputField"

// 文本域字段
export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, className, rows = 3, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Textarea
          ref={ref}
          rows={rows}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive"
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <p className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  }
)
TextareaField.displayName = "TextareaField"

// 选择框字段
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  error,
  hint,
  required,
  className,
  placeholder,
  children,
  ...props
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select {...props}>
        <SelectTrigger
          className={cn(
            error && "border-destructive focus:ring-destructive"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

// 表单组
export const FormGroup: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  )
}

// 表单操作区域
export const FormActions: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn("flex items-center gap-2 pt-4", className)}>
      {children}
    </div>
  )
}
