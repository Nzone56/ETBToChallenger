import Spinner from "./components/ui/Spinner";

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label="Loading..." />
    </main>
  );
}
