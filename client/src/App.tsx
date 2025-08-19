import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminDashboard from "@/pages/admin-dashboard";
import StudentPortal from "@/pages/student-portal";
import StudentJoin from "@/pages/student-join";
import QuizDisplay from "@/pages/quiz-display";
import StudentBuzzer from "@/pages/student-buzzer";
import Leaderboard from "@/pages/leaderboard";
import PollResults from "@/pages/poll-results";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/student" component={StudentPortal} />
      <Route path="/join" component={StudentJoin} />
      <Route path="/quiz-display/:sessionId" component={QuizDisplay} />
      <Route path="/student-buzzer/:sessionId/:participantId" component={StudentBuzzer} />
      <Route path="/leaderboard/:sessionId" component={Leaderboard} />
      <Route path="/poll-results/:questionId" component={PollResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
