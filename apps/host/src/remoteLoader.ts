// Webpack injects these two at build time because this app uses ModuleFederationPlugin's
// `shared` option. They aren't npm packages — there's nothing to import, they just exist
// at runtime, so TypeScript needs to be told about them with `declare`.
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: unknown };

// This is what a remote's remoteEntry.js actually hands us once loaded: not the component
// itself yet, but an object with two jobs — agree on shared dependency versions (init),
// and hand back a loader function for one specific exposed module (get).
interface RemoteContainer {
  init(shareScope: unknown): Promise<void>;
  get(exposedModule: string): Promise<() => unknown>;
}

// Module-level cache so multiple components asking for different remotes don't each
// trigger their own fetch of remotes.json — they all await the same promise.
let manifestPromise: Promise<Record<string, string>> | null = null;

function fetchRemotesManifest(): Promise<Record<string, string>> {
  manifestPromise ??= fetch('/remotes.json').then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load remotes manifest: ${response.status}`);
    }
    return response.json() as Promise<Record<string, string>>;
  });
  return manifestPromise;
}

// Same caching idea, per remote this time: if two different exposed modules from the same
// remote both get requested, we want one <script> tag and one container, not two.
const containerPromises = new Map<string, Promise<RemoteContainer>>();
// container.init() must only ever run once per container — calling it twice on an
// already-initialized shared scope throws. This tracks which remotes we've already done.
const initializedContainers = new Set<string>();

// This whole function replaces what Webpack used to generate automatically from a static
// `remotes: { paymentMethods: '...' }` config entry. Since we removed that, we have to do
// by hand what Webpack's "external script" loading used to do for us: inject a <script>
// tag pointing at the remote's remoteEntry.js, and wait for it to register itself as a
// global variable named after the remote (e.g. window.paymentMethods).
function loadRemoteContainer(remoteName: string, url: string): Promise<RemoteContainer> {
  const cached = containerPromises.get(remoteName);
  if (cached) {
    return cached;
  }

  const promise = new Promise<RemoteContainer>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      const container = (window as unknown as Record<string, RemoteContainer>)[remoteName];
      if (!container) {
        reject(new Error(`Remote "${remoteName}" did not register a container on window`));
        return;
      }
      resolve(container);
    };
    script.onerror = () => {
      // Don't leave a rejected promise cached — a later retry (or a different remote
      // needing the same URL) should be allowed to try loading the script again.
      containerPromises.delete(remoteName);
      reject(new Error(`Failed to load remote script: ${url}`));
    };
    document.head.appendChild(script);
  });

  containerPromises.set(remoteName, promise);
  return promise;
}

// The one function CheckoutPage actually calls. Reading top to bottom, this is the full
// sequence that used to happen invisibly, at build time, when `remotes` was hardcoded:
// 1. look up this remote's URL (used to be a literal string in webpack.config.js)
// 2. load its remoteEntry.js (used to happen automatically via the `remotes` field)
// 3. join the shared-dependency negotiation (always manual, even in the static version)
// 4. ask the container for the specific exposed module we want
export async function loadRemoteModule<T>(remoteName: string, exposedModule: string): Promise<T> {
  const manifest = await fetchRemotesManifest();
  const url = manifest[remoteName];
  if (!url) {
    throw new Error(`No URL configured for remote "${remoteName}" in remotes.json`);
  }

  // Must happen before container.init() — this is what sets up the mechanism for
  // negotiating shared react/react-dom/etc. versions in the first place.
  await __webpack_init_sharing__('default');
  const container = await loadRemoteContainer(remoteName, url);

  if (!initializedContainers.has(remoteName)) {
    await container.init(__webpack_share_scopes__.default);
    initializedContainers.add(remoteName);
  }

  // get() resolves to a factory function; calling it is what actually produces the
  // module's exports (e.g. { PaymentMethods: () => <jsx> }).
  const factory = await container.get(exposedModule);
  return factory() as T;
}
