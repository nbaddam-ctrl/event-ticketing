import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from '@/components/ui';

interface FormFieldProps extends InputProps {
  wrapperClassName?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <Input ref={ref} {...props} />
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { FormField };
