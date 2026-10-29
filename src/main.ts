import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

import { createAppContext } from './app/context';
import { navigate, startHashRouter } from './app/router';
import { createShell } from './app/shell';
import { startGameLoop } from './game/loop';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { startClockDriver } from './sim/clockDriver';

const root = document.getElementById('app');
if (!root) throw new Error('#app root missing');

const ctx = createAppContext(navigate);
const shell = createShell(root, ctx);

startHashRouter((location) => shell.show(location));
startGameLoop(ctx);
startClockDriver(ctx.clock);
registerServiceWorker();
