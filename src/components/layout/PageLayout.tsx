import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 min-h-screen">
        <div className="container mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}; 