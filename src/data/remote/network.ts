import * as Network from 'expo-network';

export type ConnectivityCheck = () => Promise<boolean>;

/** True unless the OS positively reports no connectivity (unknown reachability counts as online). */
export const isOnline: ConnectivityCheck = async () => {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected !== false && state.isInternetReachable !== false;
};
