interface ViewerErrorProps {
    onRetry?: () => void;
    className?: string;
}

const ViewerError = ({ onRetry, className = '' }: ViewerErrorProps) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 bg-bg/60 ${className}`}>
            <p className="text-text-sub">3D 모델을 불러오지 못했습니다.</p>
            {onRetry && (
                <button onClick = {onRetry} className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-bg">
                    다시시도
                </button>
            )}
        </div>
    )
}

export default ViewerError;