import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Dashboard from './Frontend/Pages/Dashboard';
import Home from './Frontend/Pages/Home';
import Signin from './Frontend/Pages/Signin';
import Task from './Frontend/Pages/Task';
import UsersPage from './Frontend/Pages/UsersPage';
import WorkHistory from './Frontend/Pages/WorkHistory';
import ServiceSettings from './Frontend/Pages/ServiceSettings';
import CreateServiceManager from './Frontend/Pages/components/CreateServiceManager';
import CreateUser from './Frontend/Pages/components/CreateUser';
import CreateWorkHistory from './Frontend/Pages/components/CreateWorkHistory';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="task" element={<Task />} />
          <Route path="settings" element={<ServiceSettings />} />
          <Route path="workhistory" element={<WorkHistory />} />
          <Route path="workhistory/createWorkHistory" element={<CreateWorkHistory />} />
          <Route path="workhistory/createServiceManager" element={<CreateServiceManager />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/create" element={<CreateUser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
