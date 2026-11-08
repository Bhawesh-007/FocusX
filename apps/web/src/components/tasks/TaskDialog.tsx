'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@focus/ui';
import { Loader2 } from 'lucide-react';
import { createTaskSchema } from '@focus/core';
import type { TaskDTO } from '@focus/core';

const formSchema = createTaskSchema.extend({
  targetMinutes: z.coerce
    .number({ invalid_type_error: 'Target minutes must be a number' })
    .int('Target minutes must be a whole number')
    .min(1, 'Target minutes must be at least 1')
    .max(1440, 'Target minutes must be at most 1440 (24h)'),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing task to edit, or null to create. */
  task: TaskDTO | null;
  defaultDate: string;
  onSubmit: (values: FormValues) => Promise<void>;
}

export function TaskDialog({ open, onOpenChange, task, defaultDate, onSubmit }: TaskDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title ?? '',
      scheduledDate: task?.scheduledDate ?? defaultDate,
      targetMinutes: task?.targetMinutes ?? 60,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? '',
        scheduledDate: task?.scheduledDate ?? defaultDate,
        targetMinutes: task?.targetMinutes ?? 60,
      });
    }
  }, [open, task, defaultDate, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the plan for this task.' : 'Plan what you will study and for how long.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            onOpenChange(false);
          })}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium leading-none">
              Title
            </label>
            <Input id="task-title" {...register('title')} placeholder="e.g. Review chapter 4" maxLength={120} />
            {errors.title ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="task-date" className="text-sm font-medium leading-none">
                Date
              </label>
              <Input id="task-date" type="date" {...register('scheduledDate')} />
              {errors.scheduledDate ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.scheduledDate.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label htmlFor="task-minutes" className="text-sm font-medium leading-none">
                Target minutes
              </label>
              <Input
                id="task-minutes"
                type="number"
                min={1}
                max={1440}
                step={1}
                {...register('targetMinutes')}
              />
              {errors.targetMinutes ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.targetMinutes.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
