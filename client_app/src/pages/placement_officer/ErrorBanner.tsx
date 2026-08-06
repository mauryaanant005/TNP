import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Non-blocking error banner shared by the Placement Coordinator report
 * pages: shown alongside (never instead of) whatever data/sample-data the
 * page has already loaded, with a Retry action.
 */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="bg-destructive text-destructive-foreground">
      <CardHeader>
        <CardTitle>Error</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p>Failed to load live data: {message}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export const NO_DATA_MESSAGE = "No matching placement data found.";
