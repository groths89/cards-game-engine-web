import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Only configure Amplify in production
if (process.env.NODE_ENV === 'production') {
    const { Amplify } = require('aws-amplify');
    const outputs = require('../amplify_outputs.json');
    Amplify.configure(outputs);
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
