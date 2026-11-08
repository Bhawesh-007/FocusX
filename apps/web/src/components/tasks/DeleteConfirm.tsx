'use client';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@focus/ui';
import { Loader2 } from 'lucide-react';
import type { TaskDTO } from '@focus/core';

interface DeleteConfirmProps {
  task: TaskDTO | null;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirm({ task, pending, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete task?</DialogTitle>
          <DialogDescription>
            {task
              ? `"${task.title}" will be deleted. If a timer is running for it, the session is stopped first. This cannot be undone.`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
