import { useCouncilStore } from './stores/councilStore';
import AppShell from './components/layout/AppShell';
import ApiKeyGate from './components/ApiKeyGate';
import IdeaInput from './components/IdeaInput';
import CouncilSession from './components/CouncilSession';

export default function App() {
  const { apiKey, startupIdea, isRunning, currentStage, startSession } =
    useCouncilStore();

  const hasSession = startupIdea && (isRunning || currentStage > 0);

  if (!apiKey) {
    return <ApiKeyGate />;
  }

  return (
    <AppShell>
      {hasSession ? (
        <CouncilSession />
      ) : (
        <IdeaInput onSubmit={(idea) => startSession(idea)} />
      )}
    </AppShell>
  );
}
