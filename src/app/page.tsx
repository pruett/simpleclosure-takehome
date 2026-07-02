import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-1 flex-col items-center justify-center bg-muted p-8 font-sans">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to shadcn/ui</CardTitle>
          <CardDescription>
            This Card is rendered with Tailwind v4 and shadcn/ui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            The homepage imports the Card component and its subcomponents from{" "}
            <code>@/components/ui/card</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
