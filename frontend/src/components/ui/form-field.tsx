import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface FormFieldProps {
  // Identifiant et nom du champ
  id: string;
  name: string;

  // Label et description
  label?: string;
  description?: string;
  helperText?: string;

  // État et validation
  error?: string;
  required?: boolean;
  disabled?: boolean;

  // Placeholder
  placeholder?: string;

  // Classes CSS additionnelles
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;

  // Pour les tooltips d'aide
  tooltip?: string;

  // Children pour les composants personnalisés
  children?: React.ReactNode;
}

export interface InputFieldProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  showPasswordToggle?: boolean;
}

export interface TextareaFieldProps extends FormFieldProps {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectFieldProps extends FormFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export interface CheckboxFieldProps extends FormFieldProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface RadioFieldProps extends FormFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

// Composant de base FormField
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  description,
  helperText,
  error,
  required,
  disabled,
  tooltip,
  className,
  labelClassName,
  errorClassName,
  children,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label avec tooltip optionnel */}
      {label && (
        <div className="flex items-center space-x-2">
          <Label
            htmlFor={id}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              error && 'text-red-600',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {/* Contenu du champ (input personnalisé ou children) */}
      {children}

      {/* Texte d'aide */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className={cn('text-sm text-red-600', errorClassName)}>
          {error}
        </p>
      )}
    </div>
  );
};

// Composant InputField avec gestion du mot de passe
export const InputField: React.FC<InputFieldProps> = ({
  type = 'text',
  value,
  onChange,
  onBlur,
  showPasswordToggle = false,
  autoComplete,
  min,
  max,
  step,
  pattern,
  className,
  inputClassName,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);

  React.useEffect(() => {
    if (type === 'password' && showPasswordToggle) {
      setInputType(showPassword ? 'text' : 'password');
    } else {
      setInputType(type);
    }
  }, [type, showPassword, showPasswordToggle]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormField {...props} className={className}>
      <div className="relative">
        <Input
          id={props.id}
          name={props.name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={props.placeholder}
          disabled={props.disabled}
          required={props.required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          className={cn(
            props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            inputClassName
          )}
          aria-describedby={props.error ? `${props.id}-error` : undefined}
          aria-invalid={!!props.error}
        />

        {/* Bouton toggle mot de passe */}
        {type === 'password' && showPasswordToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            disabled={props.disabled}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        )}
      </div>
    </FormField>
  );
};

// Composant TextareaField
export const TextareaField: React.FC<TextareaFieldProps> = ({
  value,
  onChange,
  onBlur,
  rows = 3,
  resize = 'vertical',
  className,
  inputClassName,
  ...props
}) => {
  return (
    <FormField {...props} className={className}>
      <Textarea
        id={props.id}
        name={props.name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        rows={rows}
        className={cn(
          props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          resize === 'none' && 'resize-none',
          resize === 'horizontal' && 'resize-x',
          resize === 'vertical' && 'resize-y',
          resize === 'both' && 'resize',
          inputClassName
        )}
        aria-describedby={props.error ? `${props.id}-error` : undefined}
        aria-invalid={!!props.error}
      />
    </FormField>
  );
};

// Composant SelectField
export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  inputClassName,
  ...props
}) => {
  return (
    <FormField {...props} className={className}>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={props.disabled}
      >
        <SelectTrigger
          id={props.id}
          className={cn(
            props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            inputClassName
          )}
          aria-describedby={props.error ? `${props.id}-error` : undefined}
          aria-invalid={!!props.error}
        >
          <SelectValue placeholder={placeholder || 'Sélectionner...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

// Composant CheckboxField
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  checked,
  onCheckedChange,
  className,
  ...props
}) => {
  return (
    <FormField {...props} className={className}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={props.id}
          name={props.name}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={props.disabled}
          required={props.required}
          aria-describedby={props.error ? `${props.id}-error` : undefined}
          aria-invalid={!!props.error}
        />
        <Label
          htmlFor={props.id}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer',
            props.error && 'text-red-600'
          )}
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
    </FormField>
  );
};

// Composant RadioField
export const RadioField: React.FC<RadioFieldProps> = ({
  value,
  onValueChange,
  options,
  className,
  ...props
}) => {
  return (
    <FormField {...props} className={className}>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={props.disabled}
        className="space-y-2"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${props.id}-${option.value}`}
              disabled={option.disabled || props.disabled}
            />
            <Label
              htmlFor={`${props.id}-${option.value}`}
              className={cn(
                'text-sm font-medium leading-none cursor-pointer',
                props.error && 'text-red-600'
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FormField>
  );
};

// Hook personnalisé pour gérer les champs de formulaire avec validation
export function useFormField(
  name: string,
  register: any,
  errors: any,
  options?: {
    required?: boolean;
    disabled?: boolean;
    label?: string;
    description?: string;
    helperText?: string;
    tooltip?: string;
  }
) {
  const fieldId = `field-${name}`;
  const error = errors?.[name]?.message;

  return {
    id: fieldId,
    name,
    error,
    register: register(name),
    ...options,
  };
}
