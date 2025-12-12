import { useState, useEffect } from 'react';
import type { WizardStep } from './types';
import {
  Layout,
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  MainContent,
} from './components/common';
import {
  WizardContainer,
  ClientInfoStep,
  InitialContactStep,
  FirmDocumentsStep,
  CFPDisclosureStep,
  ServicesOfferedStep,
  ClientGoalsStep,
  PlanningProcessStep,
  AccountConfigStep,
  FeeStructureStep,
  CompensationStep,
  ConflictsStep,
  AdditionalSectionsStep,
  ReviewGenerateStep,
} from './components/wizard';
import { Settings } from './components/Settings';
import { useWizardStore } from './store/wizardStore';
import { useTemplateStore } from './store/templateStore';

type AppView = 'home' | 'engagement-wizard' | 'batch' | 'settings';

// Icons as simple SVG components
const DocumentIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StackIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CogIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HomeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ClockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const { currentStep, resetWizard, lastSaved, data } = useWizardStore();
  const { recentDocuments } = useTemplateStore();
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (lastSaved && data.client?.firstName) {
      setShowResumePrompt(true);
    }
  }, []);

  const startNewEngagementLetter = () => {
    resetWizard();
    setCurrentView('engagement-wizard');
    setShowResumePrompt(false);
  };

  const resumeEngagementLetter = () => {
    setCurrentView('engagement-wizard');
    setShowResumePrompt(false);
  };

  return (
    <Layout>
      <Sidebar>
        <SidebarHeader
          title="Letter Generator"
          subtitle="Financial Planning Documents"
        />
        <SidebarNav>
          <SidebarNavItem
            icon={<HomeIcon />}
            label="Home"
            isActive={currentView === 'home'}
            onClick={() => setCurrentView('home')}
          />
          <SidebarNavItem
            icon={<DocumentIcon />}
            label="Engagement Letter"
            isActive={currentView === 'engagement-wizard'}
            onClick={() => setCurrentView('engagement-wizard')}
          />
          <SidebarNavItem
            icon={<StackIcon />}
            label="Batch Letters"
            isActive={currentView === 'batch'}
            onClick={() => setCurrentView('batch')}
            disabled
          />
          <SidebarNavItem
            icon={<CogIcon />}
            label="Settings"
            isActive={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </SidebarNav>
        <SidebarFooter>
          <p className="text-xs text-primary-400">Version 0.1.0</p>
        </SidebarFooter>
      </Sidebar>

      <MainContent>
        {currentView === 'home' && (
          <HomeView
            onStartEngagement={startNewEngagementLetter}
            onResumeEngagement={resumeEngagementLetter}
            showResumePrompt={showResumePrompt}
            lastSavedClient={data.client?.firstName ? `${data.client.firstName} ${data.client.lastName}` : undefined}
            lastSavedStep={currentStep}
            recentDocuments={recentDocuments}
          />
        )}
        {currentView === 'engagement-wizard' && (
          <WizardContainer>
            <WizardStepRouter step={currentStep} />
          </WizardContainer>
        )}
        {currentView === 'batch' && (
          <ComingSoonView title="Batch Letters" />
        )}
        {currentView === 'settings' && <Settings />}
      </MainContent>
    </Layout>
  );
}

interface HomeViewProps {
  onStartEngagement: () => void;
  onResumeEngagement: () => void;
  showResumePrompt: boolean;
  lastSavedClient?: string;
  lastSavedStep?: number;
  recentDocuments: Array<{
    id: string;
    name: string;
    type: string;
    generatedAt: string;
    filePath?: string;
  }>;
}

function HomeView({
  onStartEngagement,
  onResumeEngagement,
  showResumePrompt,
  lastSavedClient,
  lastSavedStep,
  recentDocuments,
}: HomeViewProps) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-800 mb-2">
          Federal Letter Generator
        </h1>
        <p className="text-lg text-primary-600 mb-8">
          Generate professional engagement letters and client correspondence for financial planning.
        </p>

        {/* Resume prompt */}
        {showResumePrompt && lastSavedClient && (
          <div className="mb-6 p-4 bg-secondary-50 border border-secondary-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClockIcon />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary-800">Resume your work?</h3>
                <p className="text-sm text-primary-600 mt-1">
                  You have an unfinished engagement letter for <strong>{lastSavedClient}</strong> (Step {lastSavedStep} of 13).
                </p>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={onResumeEngagement}
                    className="px-4 py-2 bg-secondary-600 text-white rounded-lg text-sm font-medium hover:bg-secondary-700 transition-colors"
                  >
                    Resume
                  </button>
                  <button
                    onClick={onStartEngagement}
                    className="px-4 py-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Start Fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={onStartEngagement}
            className="p-6 bg-white rounded-xl border-2 border-secondary-200 hover:border-secondary-400 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary-200 transition-colors">
              <DocumentIcon />
            </div>
            <h3 className="text-lg font-semibold text-primary-800 mb-2">
              New Engagement Letter
            </h3>
            <p className="text-sm text-primary-500">
              Create a customized engagement letter using our step-by-step wizard.
            </p>
          </button>

          <button
            disabled
            className="p-6 bg-white rounded-xl border-2 border-primary-200 opacity-60 cursor-not-allowed text-left"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <StackIcon />
            </div>
            <h3 className="text-lg font-semibold text-primary-800 mb-2">
              Batch Letters
            </h3>
            <p className="text-sm text-primary-500">
              Generate multiple letters from Excel data. Coming soon.
            </p>
          </button>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-xl border border-primary-200 p-6">
          <h2 className="text-lg font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <ClockIcon />
            Recent Documents
          </h2>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-8 text-primary-500">
              <p>No recent documents yet.</p>
              <p className="text-sm mt-1">Documents you generate will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocuments.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <DocumentIcon />
                    </div>
                    <div>
                      <p className="font-medium text-primary-800">{doc.name}</p>
                      <p className="text-xs text-primary-500">
                        {new Date(doc.generatedAt).toLocaleDateString()} at{' '}
                        {new Date(doc.generatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary-200 text-primary-700 text-xs rounded uppercase">
                    {doc.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard shortcuts */}
        <div className="mt-6 p-4 bg-primary-50 rounded-lg text-sm text-primary-600">
          <strong>Keyboard shortcuts:</strong> Press{' '}
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">Ctrl+S</kbd> to save,{' '}
          <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs ml-1">Ctrl+P</kbd> to
          preview
        </div>
      </div>
    </div>
  );
}

interface WizardStepRouterProps {
  step: WizardStep;
}

function WizardStepRouter({ step }: WizardStepRouterProps) {
  switch (step) {
    case 1:
      return <ClientInfoStep />;
    case 2:
      return <InitialContactStep />;
    case 3:
      return <FirmDocumentsStep />;
    case 4:
      return <CFPDisclosureStep />;
    case 5:
      return <ServicesOfferedStep />;
    case 6:
      return <ClientGoalsStep />;
    case 7:
      return <PlanningProcessStep />;
    case 8:
      return <AccountConfigStep />;
    case 9:
      return <FeeStructureStep />;
    case 10:
      return <CompensationStep />;
    case 11:
      return <ConflictsStep />;
    case 12:
      return <AdditionalSectionsStep />;
    case 13:
      return <ReviewGenerateStep />;
    default:
      return <WizardStepPlaceholder stepNumber={step} />;
  }
}

interface WizardStepPlaceholderProps {
  stepNumber: number;
}

function WizardStepPlaceholder({ stepNumber }: WizardStepPlaceholderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-8 text-center">
      <div className="text-primary-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-primary-700 mb-2">
        Step {stepNumber} - Coming Soon
      </h3>
      <p className="text-sm text-primary-500">
        This step will be implemented in a future phase.
      </p>
    </div>
  );
}

interface ComingSoonViewProps {
  title: string;
}

function ComingSoonView({ title }: ComingSoonViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary-700 mb-2">{title}</h2>
        <p className="text-primary-500">This feature is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
