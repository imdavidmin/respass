import React from "react";

export class ErrorBoundary extends React.Component<{ fallback?, children }, { hasError: boolean, fallback }> {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            fallback: this.props.fallback ?? <div className="padding-1 centre-text">
                <p>🤖 *blip boop*</p>
                <p>An unexpect error occured.</p>
            </div>
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        return this.state.hasError
            ? this.props.fallback
            : this.props.children;
    }
}