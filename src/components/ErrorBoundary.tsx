import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { captureException, addBreadcrumb, setContext } from '@/lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    eventId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Add breadcrumb for context
    addBreadcrumb({
      category: 'error-boundary',
      message: `Error caught: ${error.message}`,
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Set error context
    setContext('errorBoundary', {
      componentStack: errorInfo.componentStack,
      errorMessage: error.message,
      errorName: error.name,
    });

    // Capture exception with Sentry
    const eventId = captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      error,
      errorInfo,
      eventId,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-32">
                  <p className="text-destructive font-semibold">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
              
              {this.state.eventId && (
                <p className="text-xs text-muted-foreground text-center">
                  ID do erro: {this.state.eventId}
                </p>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={this.handleGoHome}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Início
                </Button>
                <Button 
                  className="flex-1"
                  onClick={this.handleReload}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
