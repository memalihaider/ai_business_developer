import BackupDashboard from '@/components/BackupDashboard';

export default function BackupPage() {
  return (
    <div className="container mx-auto py-6">
      <BackupDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Database Backup Management',
  description: 'Secure database backup and restore management with encryption',
};