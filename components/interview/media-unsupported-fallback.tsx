import { AlertTriangle, Globe, Shield } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MediaUnsupportedFallbackProps {
  onProceedAnyway?: () => void;
}

export function MediaUnsupportedFallback({ onProceedAnyway }: MediaUnsupportedFallbackProps) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Media Access Not Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera and microphone testing is not available</AlertTitle>
          <AlertDescription>
            Your browser or current environment doesn&apos;t support media device access.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-medium">To enable media access, please try one of the following:</h3>

          <div className="space-y-2">
            {!isHttps && !isLocalhost && (
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Use HTTPS</p>
                  <p className="text-sm text-muted-foreground">
                    Most browsers require a secure connection (HTTPS) to access camera and
                    microphone.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <Globe className="w-5 h-5 text-accent-foreground mt-0.5" />
              <div>
                <p className="font-medium text-accent-foreground">Use a Modern Browser</p>
                <p className="text-sm text-muted-foreground">
                  Ensure you&apos;re using an up-to-date version of Chrome, Firefox, Safari, or
                  Edge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
              <Shield className="w-5 h-5 text-secondary-foreground mt-0.5" />
              <div>
                <p className="font-medium text-secondary-foreground">Check Browser Permissions</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your browser allows camera and microphone access for this site.
                </p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription>
              <strong>For local development:</strong> Make sure you&apos;re running on localhost or
              127.0.0.1, or use HTTPS with a valid certificate.
            </AlertDescription>
          </Alert>

          {onProceedAnyway && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                You can proceed without testing your camera and microphone, but this may affect the
                interview experience.
              </p>
              <Button onClick={onProceedAnyway} variant="outline" className="w-full">
                Proceed Without Media Testing
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
