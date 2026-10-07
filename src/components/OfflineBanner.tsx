import { useNetworkState } from 'expo-network';

import { Banner } from './Banner';

/** Shown whenever the OS reports no connectivity, regardless of screen state. */
export function OfflineBanner() {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  return offline ? <Banner message="You're offline — showing saved data." /> : null;
}
