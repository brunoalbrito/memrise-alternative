export function TabPlaceholder({ name }: { name: "Databases" | "Contributors" }) {
  return (
    <section className="rounded-m3-lg bg-surface-container p-6">
      <h2 className="text-title-large text-on-surface">{name}</h2>
      <p className="mt-2 text-body-large text-on-surface-variant">
        {name} are coming soon.
      </p>
    </section>
  );
}
