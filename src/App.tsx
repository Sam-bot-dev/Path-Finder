import { Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Landing } from './pages/Landing'
import { Topics } from './pages/Topics'
import { TopicPage } from './pages/TopicPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { Diagnostic } from './pages/Diagnostic'
import { Results } from './pages/Results'
import { LearningPath } from './pages/LearningPath'
import { Practice } from './pages/Practice'
import { Paths } from './pages/Paths'
import { Progress } from './pages/Progress'
import { Saved } from './pages/Saved'
import { Settings } from './pages/Settings'
import { StoreProvider } from './lib/store'

function App() {
  return <StoreProvider>
    <Shell>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/learn/:topicId" element={<TopicPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/diagnostic/:topicId" element={<Diagnostic />} />
        <Route path="/results/:pathId" element={<Results />} />
        <Route path="/path/:pathId" element={<LearningPath />} />
        <Route path="/practice/:pathId" element={<Practice />} />
        <Route path="/paths" element={<Paths />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  </StoreProvider>
}
export default App
