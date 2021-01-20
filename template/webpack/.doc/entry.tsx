import React from 'react';
import ReactDOM from 'react-dom';
import { createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { DocRouter } from './components/index';
import { getAllPath } from './components/_util/config';

const Root = () => <DocRouter />;

ReactDOM.render(<Root />, document.getElementById('root'));

// 添加离线缓存
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        getAllPath().forEach((path) => {
            const handler = createHandlerBoundToURL(path);
            const navigationRoute = new NavigationRoute(handler);
            registerRoute(navigationRoute);
        })
        navigator.serviceWorker.register('/service-worker.js');
    });
}
