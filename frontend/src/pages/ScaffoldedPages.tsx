import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">{title}</h1>
        <p className="text-gray-600 max-w-md">
            Este módulo está actualmente en desarrollo. La implementación detallada está programada para el próximo sprint.
        </p>
    </div>
);

// CompanyOnboarding is now a real page exported from its own file
// OrganizationSettings is now a real page exported from its own file
// LearningCenter is now a real page exported from its own file
// ReportsDashboard is now a real page exported from its own file
// SubscriptionSettings is now a real page exported from its own file
export const UserSettings = () => <PlaceholderPage title="User Settings" />;
export const NotFound = () => <PlaceholderPage title="404 - Page Not Found" />;
