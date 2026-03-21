import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';
import Signin from './Frontend/Pages/Signin';
import Dashboard from './Frontend/Pages/Dashboard';
import Home from './Frontend/Pages/Home';
import Task from './Frontend/Pages/Task';
import reportWebVitals from './reportWebVitals';
import WorkHistory from './Frontend/Pages/WorkHistory';

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
          <Route path="workhistory" element={<WorkHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
