import { Component, ReactNode } from "react";
import ViewerError from "./ViewerError";

interface ViewerErrorBoundaryProps {
    children : ReactNode;
}

interface ViewerErrorBoundaryState {
    hasError: boolean;
}

class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
    state : ViewerErrorBoundaryState = { hasError : false };

    static getDerivedStateFromError() {
        return { hasError : true };
    }

    handleRetry = () => {
        this.setState({ hasError :false });
    };
    
    render() {
        if(this.state.hasError){
            return <ViewerError onRetry={this.handleRetry} className="h-full w-full"/>;
        }
        return this.props.children;
    }
}

export default ViewerErrorBoundary;