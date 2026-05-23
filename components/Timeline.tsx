interface Event {
  title: string;
  description: string;
  tone?: 'default' | 'red' | 'amber' | 'green';
}

export function Timeline({ events }: { events: Event[] }) {
  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div key={i} className="event">
          <div className={`dot ${e.tone && e.tone !== 'default' ? e.tone : ''}`} />
          <div>
            <strong>{e.title}</strong>
            <span>{e.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
