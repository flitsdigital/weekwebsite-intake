// ponytail: geen publieke homepage in scope — klanten komen altijd via /i/[token] binnen.
export default function Home() {
  return (
    <main className="m-auto p-6 text-center text-muted">
      <p>Je hebt een persoonlijke link nodig om je gegevens aan te leveren.</p>
    </main>
  );
}
