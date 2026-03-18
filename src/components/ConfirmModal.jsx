import React from 'react';
import { Button } from './Button';

/**
 * Modal de confirmación para reemplazar window.confirm nativo.
 * Uso:
 *   <ConfirmModal
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     onConfirm={handleDelete}
 *     title="¿Eliminar paciente?"
 *     message="Esta acción no se puede deshacer."
 *     confirmLabel="Eliminar"
 *     danger
 *   />
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container glass"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-content">
          <p className="text-sm" style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {message}
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
