import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmDialog({
    open,
    title = "Are you sure?",
    message,
    confirmLabel = "Confirm",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal
            open={open}
            onClose={onCancel}
            title={title}
            maxWidth={420}
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <p style={{ color: "var(--ink-600)", fontSize: 13.5 }}>{message}</p>
        </Modal>
    );
}