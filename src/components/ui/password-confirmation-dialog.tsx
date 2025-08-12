'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/utils/i18n';

interface PasswordConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: (password: string) => Promise<boolean>;
  loading?: boolean;
}

export function PasswordConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false
}: PasswordConfirmationDialogProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await onConfirm(password);
      if (success) {
        setPassword('');
        onOpenChange(false);
      } else {
        setError(t('incorrectPassword'));
      }
    } catch (err) {
      setError(t('incorrectPassword'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle className="text-red-600">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">
            {t('operationIrreversible')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">{t('confirmPassword')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={t('enterPassword')}
              disabled={isSubmitting || loading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || loading || !password.trim()}
            >
              {(isSubmitting || loading) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('confirm')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
