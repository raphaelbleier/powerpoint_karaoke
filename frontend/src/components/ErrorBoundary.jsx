import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('Unhandled frontend error:', error);
    }

    handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-screen">
                    <div className="error-boundary-card">
                        <h2>Something went wrong</h2>
                        <p>The app hit an unexpected UI error. Please reload and try again.</p>
                        <button type="button" className="btn-primary" onClick={this.handleReload}>
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
