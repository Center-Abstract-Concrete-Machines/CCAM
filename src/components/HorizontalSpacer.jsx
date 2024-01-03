export default function HorizontalSpacer({ className = '' }) {
    return (
        <div
            className={`border-t border-dashed border-borderColor/30 pb-4 ${className}`}
        ></div>
    );
}
