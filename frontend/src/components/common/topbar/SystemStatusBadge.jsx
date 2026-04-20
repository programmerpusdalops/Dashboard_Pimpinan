import { hexToRgbString } from '../../../lib/color';

export default function SystemStatusBadge({
    status,
    isPimpinan,
    onClick,
}) {
    if (!status) return null;

    const sharedProps = {
        className: `topbar-status${isPimpinan ? ' is-manageable' : ''}`,
        style: {
            '--status-accent': status.color,
            '--status-accent-rgb': hexToRgbString(status.color),
        },
    };

    const content = (
        <>
            <span className="topbar-status-prefix">status:</span>
            <span className="topbar-status-label">{status.label}</span>
            {isPimpinan && (
                <span className="topbar-status-tooltip">klik untuk mengubah</span>
            )}
        </>
    );

    if (!isPimpinan) {
        return <div {...sharedProps}>{content}</div>;
    }

    return (
        <button
            {...sharedProps}
            type="button"
            onClick={onClick}
            aria-label={`Ubah status sistem. Status saat ini ${status.label}`}
        >
            {content}
        </button>
    );
}

