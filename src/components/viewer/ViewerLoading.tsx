interface ViewerLoadingProps {
    className? : string;
}

const ViewerLoading = ({ className = ''}: ViewerLoadingProps) => {
    return (
        <div className= {`flex items-center justify-center bg-bg/60 ${className}`}>
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent"/>
        </div>
    )
}

export default ViewerLoading;