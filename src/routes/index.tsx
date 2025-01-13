import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import Registration from '../pages/Registration';
import Login from '../pages/Login';
import Home from '../pages/Home';

export const routesList = [
  { path: '/registration', element: <Registration /> },
  { path: '/login', element: <Login /> },
  { path: '/', element: <Home /> },
];

export const router = createBrowserRouter(routesList);
