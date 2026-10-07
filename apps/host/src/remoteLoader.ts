declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: unknown };

interface RemoteContainer {
  init(shareScope: unknown): Promise<void>;
  get(exposedModule: string): Promise<() => unknown>;
}

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

const containerPromises = new Map<string, Promise<RemoteContainer>>();
const initializedContainers = new Set<string>();

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
      containerPromises.delete(remoteName);
      reject(new Error(`Failed to load remote script: ${url}`));
    };
    document.head.appendChild(script);
  });

  containerPromises.set(remoteName, promise);
  return promise;
}

export async function loadRemoteModule<T>(remoteName: string, exposedModule: string): Promise<T> {
  const manifest = await fetchRemotesManifest();
  const url = manifest[remoteName];
  if (!url) {
    throw new Error(`No URL configured for remote "${remoteName}" in remotes.json`);
  }

  await __webpack_init_sharing__('default');
  const container = await loadRemoteContainer(remoteName, url);

  if (!initializedContainers.has(remoteName)) {
    await container.init(__webpack_share_scopes__.default);
    initializedContainers.add(remoteName);
  }

  const factory = await container.get(exposedModule);
  return factory() as T;
}
