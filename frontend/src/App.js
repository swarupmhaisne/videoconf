import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';

function App() {
    return (
        <div className="App">

            <Router>

                <AuthProvider>

                    <Routes>

                        {/* Landing Page */}
                        <Route
                            path="/"
                            element={<LandingPage />}
                        />

                        {/* Login / Register */}
                        <Route
                            path="/auth"
                            element={<Authentication />}
                        />

                        {/* Home */}
                        <Route
                            path="/home"
                            element={<HomeComponent />}
                        />

                        {/* Meeting History */}
                        <Route
                            path="/history"
                            element={<History />}
                        />

                        {/* Video Meeting */}
                        <Route
                            path="/:url"
                            element={<VideoMeetComponent />}
                        />

                    </Routes>

                </AuthProvider>

            </Router>

        </div>
    );
}

export default App; 