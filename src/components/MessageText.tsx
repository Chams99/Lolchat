// Renders a reply, showing *actions between asterisks* as stage directions.
export function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <em key={index} className="message__action">
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}
