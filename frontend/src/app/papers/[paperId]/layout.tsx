export default function PapersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full bg-background">{children}</div>;
}
