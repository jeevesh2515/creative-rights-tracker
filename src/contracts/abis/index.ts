// ABI exports for smart contracts
// Generated from compiled contracts in artifacts/

import RevenueRightsJSON from '../../../artifacts/contracts/RevenueRights.sol/RevenueRights.json';
import RevenueSplitterJSON from '../../../artifacts/contracts/RevenueSplitter.sol/RevenueSplitter.json';

export const ABIS = {
  RevenueRights: RevenueRightsJSON.abi,
  RevenueSplitter: RevenueSplitterJSON.abi,
};

export const CONTRACT_ADDRESSES = {
  REVENUE_RIGHTS: process.env.NEXT_PUBLIC_REVENUE_RIGHTS_ADDRESS || '',
  REVENUE_SPLITTER: process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS || '',
};

export const NETWORKS = {
  localhost: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://localhost:8545',
  },
  testnet: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
  },
};

export default ABIS;
